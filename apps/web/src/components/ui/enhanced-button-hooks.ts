'use client';

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  type _Transition,
} from '@petspark/motion';
import { type AnimatedStyle as ViewAnimatedStyle } from '@/effects/reanimated/animated-view';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

/**
 * Hook for glow animation effect
 */
export function useGlowAnimation(
  enableGlow: boolean,
  resolvedGlowColor: string
): {
  glowOverlayStyle: ViewAnimatedStyle;
  glowOpacity: ReturnType<typeof useSharedValue<number>>;
  glowProgress: ReturnType<typeof useSharedValue<number>>;
} {
  const glowOpacity = useSharedValue<number>(0);
  const glowProgress = useSharedValue<number>(0);

  const glowOverlayStyle = useAnimatedStyle(() => {
    if (!enableGlow) {
      return { opacity: 0, backgroundColor: resolvedGlowColor };
    }

    const opacity = interpolate(
      glowProgress.get(),
      [0, 0.5, 1],
      [0.3, 0.6, 0.3],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return {
      opacity: glowOpacity.get() * opacity,
      backgroundColor: resolvedGlowColor,
    };
  }) as ViewAnimatedStyle;

  useEffect(() => {
    if (enableGlow) {
      const timingTransition = withTiming(1, {
        duration: 2000,
        easing: (t) => t,
      });
      glowProgress.value = withRepeat(timingTransition, -1, true);
      glowOpacity.value = withSpring(1, springConfigs.smooth);
    } else {
      glowOpacity.value = withTiming(0, timingConfigs.fast);
      glowProgress.set(0);
    }
  }, [enableGlow, glowOpacity, glowProgress]);

  return {
    glowOverlayStyle,
    glowOpacity,
    glowProgress,
  };
}

/**
 * Hook for loading spinner animation
 */
export function useLoadingSpinner(loading: boolean): {
  loadingSpinnerStyle: ViewAnimatedStyle;
} {
  const loadingRotation = useSharedValue<number>(0);

  useEffect(() => {
    if (loading) {
      const timingTransition = withTiming(360, {
        duration: 1000,
        easing: (t) => t,
      });
      loadingRotation.value = withRepeat(timingTransition, -1, false);
    } else {
      loadingRotation.set(0);
    }
  }, [loading, loadingRotation]);

  const loadingSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.get()}deg` }],
  })) as ViewAnimatedStyle;

  return {
    loadingSpinnerStyle,
  };
}

/**
 * Hook to resolve glow color based on variant
 */
export function useResolvedGlowColor(
  glowColor: string | undefined,
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
): string {
  const glowColors: Record<typeof variant, string> = {
    default: 'rgba(255, 113, 91, 0.35)',
    destructive: 'rgba(248, 81, 73, 0.4)',
    outline: 'rgba(15, 23, 42, 0.25)',
    secondary: 'rgba(255, 184, 77, 0.35)',
    ghost: 'rgba(148, 163, 184, 0.25)',
    link: 'rgba(88, 166, 255, 0.35)',
  };

  return glowColor ?? glowColors[variant] ?? glowColors.default;
}

