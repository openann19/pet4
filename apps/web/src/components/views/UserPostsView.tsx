'use client';

import { communityAPI } from '@/api/community-api';
import { PostCard } from '@/components/community/PostCard';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { PostDetailView } from '@/components/community/PostDetailView';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import { ArrowLeft, User } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('UserPostsView');

function _EmptyStateView({ authorName }: { authorName: string }) {
  const entry = useEntryAnimation({ initialY: 20, initialOpacity: 0 })

  return (
    <MotionView
      style={entry.animatedStyle}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <User size={48} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {authorName} hasn't shared any posts yet
      </p>
    </MotionView>
  );
}

function PostItemView({
  post,
  index,
  onPostClick,
  onAuthorClick
}: {
  post: Post
  index: number
  onPostClick: (postId: string) => void
  onAuthorClick?: (authorId: string) => void
}) {
  const entry = useEntryAnimation({
    initialY: 20,
    initialOpacity: 0,
    delay: index * 50
  })

  return (
    <MotionView style={entry.animatedStyle}>
      <div
        onClick={() => { onPostClick(post.id); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPostClick(post.id);
          }
        }}
        role="button"
        tabIndex={0}
        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
        aria-label={`View post: ${post.text?.substring(0, 50) ?? 'Untitled post'}`}
      >
        <PostCard
          post={post}
          {...(onAuthorClick && { onAuthorClick })}
        />
      </div>
    </MotionView>
  );
}

interface UserPostsViewProps {
  userId: string;
  userName?: string;
  userAvatar?: string;
  onBack?: () => void;
  onAuthorClick?: (authorId: string) => void;
}

function UserPostsViewContent({
  userId,
  userName,
  userAvatar,
  onBack,
  onAuthorClick,
}: UserPostsViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState(userName ?? 'User');
  const [authorAvatar, setAuthorAvatar] = useState(userAvatar);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPosts = useCallback(
    async (loadMore = false) => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const feedFilters: Parameters<typeof communityAPI.queryFeed>[0] = {
          authorId: userId,
          limit: 20,
        };
        if (loadMore && cursor) {
          feedFilters.cursor = cursor;
        }
        const response = await communityAPI.queryFeed(feedFilters);

        // Extract author info from first post if available
        if (response.posts.length > 0 && !userName) {
          const firstPost = response.posts[0];
          if (firstPost) {
            if (firstPost.authorName) {
              setAuthorName(firstPost.authorName);
            }
            if (firstPost.authorAvatar) {
              setAuthorAvatar(firstPost.authorAvatar);
            }
          }
        }

        if (loadMore) {
          setPosts((currentPosts) => [...currentPosts, ...response.posts]);
        } else {
          setPosts(response.posts);
        }

        setHasMore(!!response.nextCursor);
        setCursor(response.nextCursor);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to load user posts', err, { userId });
        void toast.error('Failed to load posts');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [userId, userName, cursor]
  );

  useEffect(() => {
    void loadPosts();
  }, [userId, loadPosts]);

  useEffect(() => {
    if (!hasMore || loading || loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadPosts(true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadPosts]);

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  return (
    <PageTransitionWrapper key="user-posts-view" direction="up">
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-card">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full" aria-label="Arrow Left">
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="flex items-center gap-3 flex-1">
            <Avatar {...(authorAvatar && { src: authorAvatar })} className="w-10 h-10">
              <User size={20} />
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{authorName}'s Posts</h1>
              <p className="text-sm text-muted-foreground">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && posts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <MotionView
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User size={48} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {authorName} hasn't shared any posts yet
                </p>
              </MotionView>
            ) : (
              posts.map((post, index) => (
                <MotionView
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    onClick={() => handlePostClick(post.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePostClick(post.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label={`View post by ${post.authorName ?? 'user'}`}
                  >
                    <ErrorBoundary
                      fallback={
                        <div className="p-4 text-sm text-muted-foreground">
                          Failed to load post. Please refresh.
                        </div>
                      }
                    >
                      <PostCard post={post} {...(onAuthorClick && { onAuthorClick })} />
                    </ErrorBoundary>
                  </div>
                </MotionView>
              ))
            )}
            <div ref={observerTarget} className="h-4" />
            {loading && posts.length > 0 && (
              <div className="flex justify-center py-4">
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Post Detail Dialog */}
        {selectedPostId && (
          <PostDetailView
            open={!!selectedPostId}
            onOpenChange={(open) => {
              if (!open) setSelectedPostId(null);
            }}
            postId={selectedPostId}
            {...(onAuthorClick ? { onAuthorClick } : {})}
          />
        )}
      </div>
    </PageTransitionWrapper>
  );
}

export default function UserPostsView(props: UserPostsViewProps) {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.error('UserPostsView error', {
          error: error instanceof Error ? error.message : String(error),
        });
      }}
    >
      <UserPostsViewContent {...props} />
    </RouteErrorBoundary>
  );
}
