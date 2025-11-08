'use client';

import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/useUIConfig';

export interface UseAIReplyAuraReturn {
  animatedStyle: AnimatedStyle;
  glow: ReturnType<typeof useSharedValue<number>>;
  shimmer: ReturnType<typeof useSharedValue<number>>;
}

/**
 * AGI-Level AI Reply Visual Effects
 *
 * Provides shimmer, glow, and mood theme for AI messages
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useAIReplyAura()
 * return <AnimatedView style={animatedStyle}>{content}</AnimatedView>
 * ```
 */
export function useAIReplyAura(): UseAIReplyAuraReturn {
  const { visual } = useUIConfig();

  const glow = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!visual.enableGlow && !visual.enableShimmer) {
      return;
    }

    if (visual.enableGlow) {
      glow.value = withTiming(0.8, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });
    }

    if (visual.enableShimmer) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    }
  }, [glow, shimmer, visual.enableGlow, visual.enableShimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!visual.enableGlow && !visual.enableShimmer) {
      return {};
    }

    return {
      shadowColor: '#6EE7B7',
      shadowOpacity: visual.enableGlow ? glow.value : 0,
      shadowRadius: visual.enableGlow ? 20 * glow.value : 0,
      backgroundColor: visual.enableGlow
        ? `rgba(110, 231, 183, ${0.05 + glow.value * 0.1})`
        : undefined,
      opacity: visual.enableShimmer ? 0.9 + shimmer.value * 0.1 : undefined,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    glow,
    shimmer,
  };
}
