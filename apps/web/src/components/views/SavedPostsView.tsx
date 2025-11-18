'use client';

import { PostCard } from '@/components/community/PostCard';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { PostDetailView } from '@/components/community/PostDetailView';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { communityService } from '@/lib/community-service';
import type { Post } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import { ArrowLeft, BookmarkSimple } from '@phosphor-icons/react';
import { motion, MotionView } from '@petspark/motion';
import { useEntryAnimation } from '@/effects/reanimated';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('SavedPostsView');

function _EmptyStateView() {
  const entry = useEntryAnimation({ initialY: 20, initialOpacity: 0 })

  return (
    <MotionView
      style={entry.animatedStyle}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookmarkSimple size={48} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Posts you save will appear here for easy access later
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
          {...(onAuthorClick ? { onAuthorClick } : {})}
        />
      </div>
    </MotionView>
  );
}

interface SavedPostsViewProps {
  onBack?: () => void;
  onAuthorClick?: (authorId: string) => void;
}

function SavedPostsViewContent({ onBack, onAuthorClick }: SavedPostsViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadSavedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const savedPosts = await communityService.getSavedPosts();
      setPosts(savedPosts);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load saved posts', err);
      toast.error('Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedPosts();
  }, [loadSavedPosts]);

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  return (
    <PageTransitionWrapper key="saved-posts-view" direction="up">
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-card">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={() => void onBack()} className="rounded-full" aria-label="Arrow Left">
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <BookmarkSimple size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Saved Posts</h1>
              <p className="text-sm text-muted-foreground">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading ? (
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
                  <BookmarkSimple size={48} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Posts you save will appear here for easy access later
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
                    aria-label={`View saved post by ${post.authorName || 'user'}`}
                  >
                    <ErrorBoundary
                      fallback={
                        <div className="p-4 text-sm text-muted-foreground">
                          Failed to load post. Please refresh.
                        </div>
                      }
                    >
                      <PostCard post={post} {...(onAuthorClick ? { onAuthorClick } : {})} />
                    </ErrorBoundary>
                  </div>
                </MotionView>
              ))
            )}
            <div ref={observerTarget} className="h-4" />
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

export default function SavedPostsView(props: SavedPostsViewProps) {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.error('SavedPostsView error', {
          error: error instanceof Error ? error.message : String(error),
        });
      }}
    >
      <SavedPostsViewContent {...props} />
    </RouteErrorBoundary>
  );
}
