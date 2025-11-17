'use client';

import { useSharedValue, useAnimatedStyle, withTiming, withDelay } from '@petspark/motion';
import { useEffect } from 'react';
import { timingConfigs } from './transitions';
import type { AnimatedStyle } from './animated-view';

export interface UseStaggeredItemOptions {
  index: number;
  delay?: number;
  staggerDelay?: number;
}

export interface UseStaggeredItemReturn {
  opacity: ReturnType<typeof useSharedValue<number>>;
  y: ReturnType<typeof useSharedValue<number>>;
  itemStyle: AnimatedStyle;
}

/**
 * Hook for staggered list item animations
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useStaggeredItem(options: UseStaggeredItemOptions): UseStaggeredItemReturn {
  const { index, delay = 0, staggerDelay = 50 } = options;

  const opacity = useSharedValue(0);
  const y = useSharedValue(20);

  useEffect(() => {
    const totalDelay = delay + index * staggerDelay;
    const delayMs = totalDelay;

    opacity.value = withDelay(delayMs, withTiming(1, timingConfigs.smooth));
    y.value = withDelay(delayMs, withTiming(0, timingConfigs.smooth));
  }, [index, delay, staggerDelay, opacity, y]);

  const itemStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: y.value }],
    };
  }) as AnimatedStyle;

  return {
    opacity,
    y,
    itemStyle,
  };
}
