'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseStaggeredContainerOptions {
  delay?: number;
  staggerDelay?: number;
}

export interface UseStaggeredContainerReturn {
  opacity: ReturnType<typeof useSharedValue<number>>;
  x: ReturnType<typeof useSharedValue<number>>;
  containerStyle: AnimatedStyle;
}

export function useStaggeredContainer(
  options: UseStaggeredContainerOptions = {}
): UseStaggeredContainerReturn {
  const { delay = 0.2, staggerDelay = 0.1 } = options;

  const opacity = useSharedValue(0);
  const x = useSharedValue(20);

  useEffect(() => {
    const delayMs = delay * 1000;
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 400 }));
    x.value = withDelay(delayMs, withSpring(0, springConfigs.smooth));
  }, [delay, staggerDelay, opacity, x]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: x.value }],
    };
  }) as AnimatedStyle;

  return {
    opacity,
    x,
    containerStyle,
  };
}
