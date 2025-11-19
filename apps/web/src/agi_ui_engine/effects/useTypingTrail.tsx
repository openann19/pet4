'use client';

import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useAnimatedStyle,
  type AnimatedStyle,
} from '@petspark/motion';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseTypingTrailReturn {
  animatedStyle: AnimatedStyle;
  trailOpacity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Typing indicator shimmer trail effect
 *
 * Creates a shimmer trail effect for typing indicators
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useTypingTrail()
 * return <AnimatedView style={animatedStyle}>{dots}</AnimatedView>
 * ```
 */
export function useTypingTrail(): UseTypingTrailReturn {
  const { visual, animation } = useUIConfig();

  const trailOpacity = useSharedValue<number>(0);

  useEffect(() => {
    if (!visual.enableShimmer || !animation.showTrails) {
      return;
    }

    trailOpacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.3, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, [trailOpacity, visual.enableShimmer, animation.showTrails]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!visual.enableShimmer || !animation.showTrails) {
      return {};
    }

    return {
      opacity: trailOpacity.value,
      transform: [
        {
          translateX: (trailOpacity.value - 0.5) * 4,
        },
      ],
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    trailOpacity,
  };
}
