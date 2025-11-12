'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { communityAPI } from '@/api/community-api';
import { filterPostsByFollows } from '@/core/services/follow-graph';
import type { Post, PostFilters } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useFeedManagement');

export interface UseFeedManagementOptions {
  feedTab: 'for-you' | 'following';
  enabled?: boolean;
}

export interface UseFeedManagementReturn {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  cursor: string | undefined;
  loadFeed: (loadMore?: boolean) => Promise<void>;
  refreshFeed: () => Promise<void>;
  resetFeed: () => void;
}

export function useFeedManagement(options: UseFeedManagementOptions): UseFeedManagementReturn {
  const { feedTab, enabled = true } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const loadingRef = useRef(false);

  const loadFeed = useCallback(
    async (loadMore = false): Promise<void> => {
      if (loadingRef.current || !enabled) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const { userService } = await import('@/lib/user-service');
        const user = await userService.user();
        const filters: PostFilters & { limit?: number; cursor?: string } = {
          limit: 20,
          ...(loadMore && cursor ? { cursor } : {}),
        };

        const response = await communityAPI.queryFeed(filters, user?.id);

        let filteredPosts = response.posts;
        if (feedTab === 'following') {
          if (user) {
            filteredPosts = await filterPostsByFollows<Post>(response.posts, user.id);
          }
        }

        if (loadMore) {
          setPosts((currentPosts) => [
            ...(Array.isArray(currentPosts) ? currentPosts : []),
            ...filteredPosts,
          ]);
        } else {
          setPosts(filteredPosts);
        }

        setHasMore(!!response.nextCursor);
        setCursor(response.nextCursor);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to load feed', err, { action: 'loadFeed', feedTab });
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [feedTab, cursor, enabled]
  );

  const refreshFeed = useCallback(async (): Promise<void> => {
    setCursor(undefined);
    setHasMore(true);
    await loadFeed(false);
  }, [loadFeed]);

  const resetFeed = useCallback((): void => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
  }, []);

  useEffect(() => {
    if (enabled) {
      void loadFeed();
    }
  }, [enabled, feedTab, loadFeed]);

  return {
    posts,
    loading,
    hasMore,
    cursor,
    loadFeed,
    refreshFeed,
    resetFeed,
  };
}
