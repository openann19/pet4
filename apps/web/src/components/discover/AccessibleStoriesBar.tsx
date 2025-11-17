'use client';

import React, { useMemo, useCallback } from 'react';
import { filterActiveStories, groupStoriesByUser } from '@petspark/shared';
import type { Story } from '@petspark/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from '@phosphor-icons/react';
import { getSpacingClassesFromConfig } from '@/lib/typography';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface AccessibleStoriesBarProps {
  stories: Story[];
  currentUserId: string;
  onStoryClick?: (story: Story) => void;
  onAddStory?: () => void;
}

export function AccessibleStoriesBar({
  stories,
  currentUserId,
  onStoryClick,
  onAddStory,
}: AccessibleStoriesBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeStories = useMemo(() => filterActiveStories(stories), [stories]);
  const storiesByUser = useMemo(() => groupStoriesByUser(activeStories), [activeStories]);

  const ownStories = useMemo(
    () => activeStories.filter((s) => s.userId === currentUserId),
    [activeStories, currentUserId]
  );

  const otherStories = useMemo(
    () => activeStories.filter((s) => s.userId !== currentUserId),
    [activeStories, currentUserId]
  );

  const uniqueUserIds = useMemo(
    () => Array.from(new Set([...otherStories.map((s) => s.userId)])),
    [otherStories]
  );

  const handleStoryClick = useCallback(
    (userId: string) => {
      const userStories = storiesByUser.get(userId);
      const firstStory = userStories?.[0];
      if (firstStory && onStoryClick) {
        onStoryClick(firstStory);
      }
    },
    [storiesByUser, onStoryClick]
  );

  const handleAddStory = useCallback(() => {
    onAddStory?.();
  }, [onAddStory]);

  const hasOwnStories = ownStories.length > 0;
  const firstOwnStory = ownStories[0] ?? null;

  // Motion classes - respect prefers-reduced-motion (Rule 7)
  const motionClasses = prefersReducedMotion
    ? ''
    : 'transition-transform duration-150 ease-out hover:scale-105 active:scale-95';

  return (
    <ul
      className={cn(
        'flex overflow-x-auto scrollbar-hide',
        getSpacingClassesFromConfig({ gap: 'md', paddingY: 'sm' })
      )}
      aria-label="Stories"
    >
      {/* Add Story Button */}
      <li className="shrink-0">
        <button
          type="button"
          onClick={handleAddStory}
          className={cn(
            'relative h-16 w-16 rounded-full border-2 border-dashed',
            'flex items-center justify-center',
            'border-border bg-background/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'text-foreground',
            motionClasses
          )}
          aria-label="Create new story"
        >
          <Plus size={24} weight="bold" className="text-muted-foreground" aria-hidden="true" />
        </button>
      </li>

      {/* Own Story */}
      {hasOwnStories && firstOwnStory && (
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => handleStoryClick(currentUserId)}
            className={cn(
              'relative h-16 w-16 rounded-full border-2 overflow-hidden',
              'border-border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              motionClasses
            )}
            aria-label={`View story from ${firstOwnStory.petName || 'You'}${firstOwnStory.views?.some((v) => v.userId === currentUserId) ? ', viewed' : ', new'}`}
          >
            <div
              className="w-full h-full rounded-full p-0.5"
              style={{
                background: 'linear-gradient(to top right, var(--primary), var(--accent), var(--secondary))',
              }}
            >
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={firstOwnStory.petPhoto} alt={firstOwnStory.petName || 'You'} />
                <AvatarFallback
                  className="font-bold text-primary-foreground"
                  style={{
                    background: 'linear-gradient(to bottom right, var(--primary), var(--accent))',
                  }}
                >
                  {(firstOwnStory.petName || 'You')[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </button>
        </li>
      )}

      {/* Other Stories */}
      {uniqueUserIds.map((userId) => {
        const userStories = storiesByUser.get(userId);
        if (!userStories || userStories.length === 0) return null;

        const firstStory = userStories[0];
        if (!firstStory) return null;
        
        const hasUnviewed = !userStories.some(
          (s) => Array.isArray(s.views) && s.views.some((v) => v.userId === currentUserId)
        );

        return (
          <li key={userId} className="shrink-0">
            <button
              type="button"
              onClick={() => handleStoryClick(userId)}
              className={cn(
                'relative h-16 w-16 rounded-full border-2 overflow-hidden',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                hasUnviewed
                  ? 'border-border p-0.5'
                  : 'border-border',
                motionClasses
              )}
              style={
                hasUnviewed
                  ? {
                      background: 'linear-gradient(to top right, var(--primary), var(--accent), var(--secondary))',
                    }
                  : undefined
              }
              aria-label={`View story from ${firstStory.petName || firstStory.userName}${hasUnviewed ? ', new' : ', viewed'}`}
            >
              {hasUnviewed ? (
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={firstStory.petPhoto} alt={firstStory.petName || firstStory.userName} />
                  <AvatarFallback
                    className="font-bold text-primary-foreground"
                    style={{
                      background: 'linear-gradient(to bottom right, var(--primary), var(--accent))',
                    }}
                  >
                    {(firstStory.petName || firstStory.userName)[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="w-full h-full">
                  <AvatarImage src={firstStory.petPhoto} alt={firstStory.petName || firstStory.userName} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                    {(firstStory.petName || firstStory.userName)[0]}
                  </AvatarFallback>
                </Avatar>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

