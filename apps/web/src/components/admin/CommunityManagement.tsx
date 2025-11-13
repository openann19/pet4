'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trash,
  Flag,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  ChatCircle,
  ShareNetwork,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Post } from '@/lib/community-types';
import { PostCard } from '@/components/community/PostCard';
import { communityService } from '@/lib/community-service';
import { createLogger } from '@/lib/logger';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useSharedValue, useAnimatedStyle, withTiming } from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

const logger = createLogger('CommunityManagement');

interface PostItemProps {
  post: Post;
  isHidden: boolean;
  onHide: (postId: string) => void;
  onUnhide: (postId: string) => void;
  onDelete: (post: Post) => void;
}

function PostItem({ post, isHidden, onHide, onUnhide, onDelete }: PostItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  }) as AnimatedStyle;

  const postId = post._id ?? post.id;
  if (!postId) {
    return null;
  }

  return (
    <AnimatedView style={animatedStyle} className="relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {isHidden ? (
          <Button size="sm" variant="secondary" onClick={() => onUnhide(postId)}>
            <Eye size={16} className="mr-2" />
            Unhide
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onHide(postId)}>
            <EyeSlash size={16} className="mr-2" />
            Hide
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={() => onDelete(post)}>
          <Trash size={16} className="mr-2" />
          Delete
        </Button>
      </div>
      <PostCard post={post} />
    </AnimatedView>
  );
}

export default function CommunityManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flaggedPosts] = useStorage<string[]>('flagged-posts', []);
  const [hiddenPosts, setHiddenPosts] = useStorage<string[]>('hidden-posts', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'hidden'>('all');

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const feedResponse = await communityService.getFeed({ mode: 'for-you', limit: 1000 });
      setPosts(feedResponse.posts);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load posts', err, { action: 'loadPosts' });
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const flaggedPostsList = useMemo(() => {
    return posts.filter((p) => {
      const postId = p._id ?? p.id;
      return postId && flaggedPosts?.includes(postId);
    });
  }, [posts, flaggedPosts]);

  const hiddenPostsList = useMemo(() => {
    return posts.filter((p) => {
      const postId = p._id ?? p.id;
      return postId && hiddenPosts?.includes(postId);
    });
  }, [posts, hiddenPosts]);

  const filteredPosts = useMemo(() => {
    let list =
      activeTab === 'all' ? posts : activeTab === 'flagged' ? flaggedPostsList : hiddenPostsList;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.text?.toLowerCase().includes(query) ?? false) ||
          (p.authorName?.toLowerCase().includes(query) ?? false)
      );
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();
      return dateB - dateA;
    });
  }, [posts, flaggedPostsList, hiddenPostsList, activeTab, searchQuery]);

  const handleHidePost = useCallback(
    (postId: string) => {
      void setHiddenPosts((prev) => {
        if (prev?.includes(postId)) {
          return prev;
        }
        return [...(prev || []), postId];
      }).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to hide post', err, { postId });
        toast.error('Failed to hide post');
      });
      toast.success('Post hidden from feed');
    },
    [setHiddenPosts]
  );

  const handleUnhidePost = useCallback(
    (postId: string) => {
      void setHiddenPosts((prev) => (prev || []).filter((id) => id !== postId)).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to unhide post', err, { postId });
        toast.error('Failed to restore post');
      });
      toast.success('Post restored to feed');
    },
    [setHiddenPosts]
  );

  const handleDeletePost = useCallback(async () => {
    if (!selectedPost) {
      return;
    }

    const postId = selectedPost._id ?? selectedPost.id;
    if (!postId) {
      toast.error('Invalid post ID');
      return;
    }

    try {
      await communityService.deletePost(postId);
      toast.success('Post deleted successfully');
      setShowDeleteDialog(false);
      setSelectedPost(null);
      await loadPosts();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete post', err, { postId, action: 'deletePost' });
      toast.error('Failed to delete post');
    }
  }, [selectedPost, loadPosts]);

  const handleDeleteClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setShowDeleteDialog(true);
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    return {
      total: posts.length,
      flagged: flaggedPostsList.length,
      hidden: hiddenPostsList.length,
      last24h: posts.filter((p) => {
        const createdAt = new Date(p.createdAt ?? 0).getTime();
        return createdAt > last24h;
      }).length,
    };
  }, [posts, flaggedPostsList, hiddenPostsList]);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Community Posts</h2>
          <p className="text-muted-foreground">Manage and moderate community content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ChatCircle size={32} className="text-primary" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 24h</p>
                <p className="text-2xl font-bold">{stats.last24h}</p>
              </div>
              <ShareNetwork size={32} className="text-accent" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold">{stats.flagged}</p>
              </div>
              <Flag size={32} className="text-destructive" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hidden</p>
                <p className="text-2xl font-bold">{stats.hidden}</p>
              </div>
              <EyeSlash size={32} className="text-muted-foreground" weight="fill" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex-1 relative">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                placeholder="Search posts by content or author..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); }}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="flagged">
                  Flagged{' '}
                  {stats.flagged > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats.flagged}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="hidden">Hidden</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-150">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading posts...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts found</p>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const postId = post._id ?? post.id;
                  if (!postId) {
                    return null;
                  }
                  return (
                    <PostItem
                      key={postId}
                      post={post}
                      isHidden={hiddenPosts?.includes(postId) ?? false}
                      onHide={handleHidePost}
                      onUnhide={handleUnhidePost}
                      onDelete={handleDeleteClick}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDeletePost().catch((error) => {
                  const err = error instanceof Error ? error : new Error(String(error));
                  logger.error('Failed to delete post from button', err);
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
