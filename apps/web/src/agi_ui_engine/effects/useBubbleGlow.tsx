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

export interface UseBubbleGlowOptions {
  enabled?: boolean;
  color?: string;
  intensity?: number;
}

export interface UseBubbleGlowReturn {
  animatedStyle: AnimatedStyle;
  glowIntensity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Bubble glow effect with configurable intensity and color
 *
 * Creates a pulsing glow effect around chat bubbles
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useBubbleGlow({ color: '#FF6B6B', intensity: 0.8 })
 * return <AnimatedView style={animatedStyle}>{bubble}</AnimatedView>
 * ```
 */
export function useBubbleGlow(options: UseBubbleGlowOptions = {}): UseBubbleGlowReturn {
  const { enabled = true, color = '#6EE7B7', intensity = 0.8 } = options;
  const { visual } = useUIConfig();

  const glowIntensity = useSharedValue<number>(0);

  useEffect(() => {
    if (!enabled || !visual.enableGlow) {
      return;
    }

    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(intensity, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(intensity * 0.6, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, [glowIntensity, enabled, visual.enableGlow, intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enableGlow) {
      return {};
    }

    const shadowRadius = glowIntensity.value * 20;
    const shadowOpacity = glowIntensity.value * 0.6;

    return {
      shadowColor: color,
      shadowOpacity,
      shadowRadius,
      shadowOffset: {
        width: 0,
        height: 0,
      },
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    glowIntensity,
  };
}
