'use client';

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseGlassBackgroundOptions {
  enabled?: boolean;
  intensity?: number;
}

export interface UseGlassBackgroundReturn {
  animatedStyle: AnimatedStyle;
  blurIntensity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Glassmorphism background effect
 *
 * Creates a glass-like background with blur and transparency
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useGlassBackground({ intensity: 0.8 })
 * return <AnimatedView style={animatedStyle}>{content}</AnimatedView>
 * ```
 */
export function useGlassBackground(
  options: UseGlassBackgroundOptions = {}
): UseGlassBackgroundReturn {
  const { enabled = true, intensity = 0.8 } = options;
  const { visual } = useUIConfig();

  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    if (!enabled || !visual.enableBlur) {
      return;
    }

    blurIntensity.value = withTiming(intensity, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [enabled, visual.enableBlur, blurIntensity, intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enableBlur) {
      return {};
    }

    return {
      backdropFilter: `blur(${blurIntensity.value * 20}px)`,
      WebkitBackdropFilter: `blur(${blurIntensity.value * 20}px)`,
      backgroundColor: `rgba(255, 255, 255, ${0.1 * blurIntensity.value})`,
      borderWidth: 1,
      borderColor: `rgba(255, 255, 255, ${0.2 * blurIntensity.value})`,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    blurIntensity,
  };
}
