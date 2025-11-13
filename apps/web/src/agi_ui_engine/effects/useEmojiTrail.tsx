'use client';

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseEmojiTrailOptions {
  enabled?: boolean;
}

export interface UseEmojiTrailReturn {
  trigger: (x: number, y: number) => void;
  animatedStyle: AnimatedStyle;
  trailOpacity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Emoji trail effect for reactions
 *
 * Creates a trailing effect when emoji reactions are added
 *
 * @example
 * ```tsx
 * const { trigger } = useEmojiTrail({ emoji: '❤️' })
 * const handleReact = () => {
 *   trigger(100, 100)
 * }
 * ```
 */
export function useEmojiTrail(options: UseEmojiTrailOptions = {}): UseEmojiTrailReturn {
  const { enabled = true } = options;
  const { animation } = useUIConfig();

  const trailOpacity = useSharedValue(0);

  const trigger = useCallback(
    (_x: number, _y: number): void => {
      if (!enabled || !animation.showTrails) {
        return;
      }

      trailOpacity.value = withSequence(
        withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(0, {
          duration: 600,
          easing: Easing.in(Easing.ease),
        })
      );
    },
    [enabled, animation.showTrails, trailOpacity]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !animation.showTrails) {
      return {};
    }

    return {
      opacity: trailOpacity.value,
      transform: [
        {
          translateY: -trailOpacity.value * 30,
        },
        {
          scale: 0.5 + trailOpacity.value * 0.5,
        },
      ],
    };
  }) as AnimatedStyle;

  return {
    trigger,
    animatedStyle,
    trailOpacity,
  };
}
