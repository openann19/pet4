/**
 * Discover Swipe Hook
 *
 * Manages swipe gestures and actions for discover view
 */

import { useCallback } from 'react';
import { useSwipe } from '@/hooks/useSwipe';
import { useStorage } from '@/hooks/use-storage';
import { useMatching } from '@/hooks/useMatching';
import type { Pet, SwipeAction, Match } from '@/lib/types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';

const logger = createLogger('useDiscoverSwipe');

export interface UseDiscoverSwipeOptions {
  currentPet: Pet | null;
  currentIndex: number;
  onSwipeComplete: () => void;
  onMatch: (match: Match) => void;
}

export interface UseDiscoverSwipeReturn {
  swipeAnimatedStyle: unknown;
  likeOpacityStyle: unknown;
  passOpacityStyle: unknown;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleSwipe: (action: 'like' | 'pass') => Promise<void>;
  reset: () => void;
}

export function useDiscoverSwipe(options: UseDiscoverSwipeOptions): UseDiscoverSwipeReturn {
  const { currentPet, currentIndex: _currentIndex, onSwipeComplete, onMatch } = options;

  const [, setSwipeHistory] = useStorage<SwipeAction[]>('swipe-history', []);
  const [, setMatches] = useStorage<Match[]>('matches', []);

  const { performSwipe, checkMatch } = useMatching();

  const handleSwipe = useCallback(
    async (action: 'like' | 'pass'): Promise<void> => {
      if (!currentPet) {
        return;
      }

      try {
        // Haptic feedback
        haptics.impact(action === 'like' ? 'medium' : 'light');

        // Perform swipe
        const swipeResult = await performSwipe({
          targetPetId: currentPet.id,
          action,
        });

        // Save to history
        const newSwipe: SwipeAction = {
          id: `swipe-${Date.now()}`,
          petId: '', // TODO: Get from user context or options
          targetPetId: currentPet.id,
          action,
          timestamp: new Date().toISOString(),
        };

        void setSwipeHistory((prev) => [...(prev ?? []), newSwipe]).catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to save swipe history', err, { petId: currentPet.id, action });
        });

        // Check for match
        if (action === 'like' && swipeResult.compatibility >= 80) {
          const matchResult = await checkMatch(currentPet.id);

          if (matchResult.isMatch) {
            const match: Match = {
              id: `match-${Date.now()}`,
              petId: '', // TODO: Get from user context
              matchedPetId: currentPet.id,
              matchedPetName: currentPet.name,
              matchedPetPhoto: currentPet.photo,
              compatibilityScore: matchResult.compatibility || swipeResult.compatibility,
              compatibility: matchResult.compatibility || swipeResult.compatibility,
              reasoning: matchResult.reasoning || [],
              matchedAt: new Date().toISOString(),
              status: 'active',
            };

            void setMatches((prev) => [...(prev ?? []), match]).catch((error) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to save match', err, { petId: currentPet.id });
            });
            onMatch(match);
            toast.success("It's a Match!");
          }
        }

        // Move to next pet
        onSwipeComplete();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Swipe failed', err, { petId: currentPet.id, action });
        toast.error('Failed to process swipe. Please try again.');
      }
    },
    [currentPet, performSwipe, checkMatch, setSwipeHistory, setMatches, onMatch, onSwipeComplete]
  );

  const {
    animatedStyle: swipeAnimatedStyle,
    likeOpacityStyle,
    passOpacityStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset,
  } = useSwipe({
    onSwipe: (dir) => {
      void handleSwipe(dir === 'right' ? 'like' : 'pass').catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Swipe handler failed', err, { direction: dir });
      });
    },
  });

  return {
    swipeAnimatedStyle,
    likeOpacityStyle,
    passOpacityStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleSwipe,
    reset,
  };
}
