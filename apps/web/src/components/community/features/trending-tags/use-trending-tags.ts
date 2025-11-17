'use client';

import { useCallback, useState } from 'react';
import { communityAPI } from '@/api/community-api';
import type { Post } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useTrendingTags');

export interface UseTrendingTagsReturn {
  trendingTags: string[];
  loadTrendingTags: () => Promise<void>;
}

export function useTrendingTags(): UseTrendingTagsReturn {
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  const loadTrendingTags = useCallback(async (): Promise<void> => {
    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      const response = await communityAPI.queryFeed({ limit: 100 }, user?.id);
      const allTags: string[] = [];

      if (Array.isArray(response.posts)) {
        response.posts.forEach((post: Post) => {
          if (post.tags && Array.isArray(post.tags)) {
            allTags.push(...post.tags);
          }
        });
      }

      const tagCounts = allTags.reduce(
        (acc, tag) => {
          acc[tag] = (acc[tag] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      setTrendingTags(sortedTags);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load trending tags', err, { action: 'loadTrendingTags' });
      setTrendingTags([]);
    }
  }, []);

  return {
    trendingTags,
    loadTrendingTags,
  };
}
