'use client';

import { useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import { haptics } from '@/lib/haptics';

const logger = createLogger('usePostActions');

export interface UsePostActionsReturn {
  handleAuthorClick: (authorId: string) => void;
  handlePostCreated: () => void;
  handleToggleFavorite: (profileId: string) => void;
}

export interface UsePostActionsOptions {
  onPostCreated?: () => void;
  onRefreshFeed?: () => void;
}

export function usePostActions(options: UsePostActionsOptions = {}): UsePostActionsReturn {
  const { onPostCreated, onRefreshFeed } = options;

  const handleAuthorClick = useCallback((authorId: string): void => {
    logger.info('View author profile', { action: 'viewAuthorProfile', authorId });
  }, []);

  const handlePostCreated = useCallback((): void => {
    onPostCreated?.();
    onRefreshFeed?.();
    haptics.success();
  }, [onPostCreated, onRefreshFeed]);

  const handleToggleFavorite = useCallback((_profileId: string): void => {
    haptics.trigger('light');
  }, []);

  return {
    handleAuthorClick,
    handlePostCreated,
    handleToggleFavorite,
  };
}
