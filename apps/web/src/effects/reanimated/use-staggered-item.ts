'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  type AnimatedStyle,
} from '@petspark/motion';
import { useEffect } from 'react';
import { timingConfigs } from './transitions';
import { motionTheme } from '@/config/motionTheme';
import type { BaseMotionReturn } from './types';
import { useMotionPreferences, type MotionHookOptions } from './useMotionPreferences';

export interface UseStaggeredItemOptions extends MotionHookOptions {
  index: number;
  delay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down';
}

export interface UseStaggeredItemReturn extends BaseMotionReturn<AnimatedStyle> {
  opacity: ReturnType<typeof useSharedValue<number>>;
  y: ReturnType<typeof useSharedValue<number>>;
  itemStyle: AnimatedStyle;
}

/**
 * Hook for staggered list item animations
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useStaggeredItem(options: UseStaggeredItemOptions): UseStaggeredItemReturn {
  const {
    index,
    delay = 0,
    staggerDelay = motionTheme.durations.staggerItem,
    direction = 'up',
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();
  const isOff = respectPreferences && preferences.isOff;
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;

  const baseDistance = motionTheme.distance.listStaggerY;
  const initialOffset = direction === 'up' ? baseDistance : -baseDistance;
  const yInitial = isReduced ? initialOffset * 0.5 : initialOffset;
  const durationMs = isReduced ? motionTheme.durations.fast : motionTheme.durations.normal;

  const opacity = useSharedValue(isOff ? 1 : 0);
  const y = useSharedValue(isOff ? 0 : yInitial);

  useEffect(() => {
    if (isOff) {
      opacity.value = 1;
      y.value = 0;
      return;
    }

    const totalDelay = delay + index * staggerDelay;
    const delayMs = totalDelay;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: durationMs, easing: timingConfigs.smooth.easing })
    );
    y.value = withDelay(
      delayMs,
      withTiming(0, { duration: durationMs, easing: timingConfigs.smooth.easing })
    );
  }, [delay, durationMs, index, isOff, opacity, staggerDelay, y]);

  const itemStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: y.value }],
    };
  });

  return {
    kind: 'layout',
    animatedStyle: itemStyle,
    opacity,
    y,
    itemStyle,
  };
}
