'use client';


import { useUIConfig } from '@/hooks/use-ui-config';
import { useEffect } from 'react';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
  type AnimatedStyle,
} from '@petspark/motion';

export interface UseDynamicBackgroundMeshOptions {
  enabled?: boolean;
  speed?: number;
}

export interface UseDynamicBackgroundMeshReturn {
  animatedStyle: AnimatedStyle;
  meshProgress: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Dynamic background mesh effect
 *
 * Creates an animated mesh/particle background
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useDynamicBackgroundMesh({ speed: 0.5 })
 * return <AnimatedView style={animatedStyle}>{content}</AnimatedView>
 * ```
 */
export function useDynamicBackgroundMesh(
  options: UseDynamicBackgroundMeshOptions = {}
): UseDynamicBackgroundMeshReturn {
  const { enabled = true, speed = 1 } = options;
  const { theme } = useUIConfig();

  const meshProgress = useSharedValue<number>(0);

  useEffect(() => {
    if (!enabled || !theme.dynamicBackground) {
      return;
    }

    meshProgress.value = withRepeat(
      withTiming(1, {
        duration: 10000 / speed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [enabled, theme.dynamicBackground, meshProgress, speed]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !theme.dynamicBackground) {
      return {} as Record<string, unknown>;
    }

    const angle = meshProgress.value * 360;

    return {
      background: `linear-gradient(${angle}deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))`,
      backgroundSize: '200% 200%',
      backgroundPosition: `${meshProgress.value * 100}% ${meshProgress.value * 100}%`,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    meshProgress,
  };
}
