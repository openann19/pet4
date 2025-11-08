'use client';

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/useUIConfig';

export interface UseMessageShimmerOptions {
  enabled?: boolean;
  duration?: number;
  shimmerWidth?: number;
}

export interface UseMessageShimmerReturn {
  animatedStyle: AnimatedStyle;
  shimmerProgress: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Message shimmer effect for placeholders and loading states
 *
 * Creates a shimmer sweep effect across message placeholders
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useMessageShimmer({ enabled: isLoading })
 * return <AnimatedView style={animatedStyle}>{placeholder}</AnimatedView>
 * ```
 */
export function useMessageShimmer(options: UseMessageShimmerOptions = {}): UseMessageShimmerReturn {
  const { enabled = true, duration = 2000, shimmerWidth = 200 } = options;

  const { visual } = useUIConfig();

  const shimmerProgress = useSharedValue(-shimmerWidth);

  useEffect(() => {
    if (!enabled || !visual.enableShimmer) {
      return;
    }

    shimmerProgress.value = withRepeat(
      withTiming(shimmerWidth, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [enabled, visual.enableShimmer, shimmerProgress, shimmerWidth, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enableShimmer) {
      return {};
    }

    const opacity = Math.abs(shimmerProgress.value / shimmerWidth) * 0.6 + 0.3;

    return {
      transform: [
        {
          translateX: shimmerProgress.value,
        },
      ],
      opacity,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    shimmerProgress,
  };
}
