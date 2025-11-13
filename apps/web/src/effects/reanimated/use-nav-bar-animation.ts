'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from '@petspark/motion';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseNavBarAnimationOptions {
  delay?: number;
}

export interface UseNavBarAnimationReturn {
  opacity: ReturnType<typeof useSharedValue<number>>;
  translateY: ReturnType<typeof useSharedValue<number>>;
  scale: ReturnType<typeof useSharedValue<number>>;
  navStyle: AnimatedStyle;
  shimmerTranslateX: ReturnType<typeof useSharedValue<number>>;
  shimmerOpacity: ReturnType<typeof useSharedValue<number>>;
  shimmerStyle: AnimatedStyle;
}

export function useNavBarAnimation(
  options: UseNavBarAnimationOptions = {}
): UseNavBarAnimationReturn {
  const { delay = 200 } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const scale = useSharedValue(0.95);
  const shimmerTranslateX = useSharedValue(-100);
  const shimmerOpacity = useSharedValue(0);

  useEffect(() => {
    const delayMs = delay;
    opacity.value = withDelay(delayMs, withSpring(1, springConfigs.smooth));
    translateY.value = withDelay(delayMs, withSpring(0, springConfigs.smooth));
    scale.value = withDelay(delayMs, withTiming(1, { duration: 300 }));

    shimmerTranslateX.value = withRepeat(
      withSequence(withTiming(100, { duration: 0 }), withTiming(100, { duration: 4000 })),
      -1,
      false
    );
    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.4, { duration: 1000 }),
        withTiming(0.4, { duration: 2000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [delay, opacity, translateY, scale, shimmerTranslateX, shimmerOpacity]);

  const navStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  }) as AnimatedStyle;

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${String(shimmerTranslateX.value ?? '')}%` }],
      opacity: shimmerOpacity.value,
    };
  }) as AnimatedStyle;

  return {
    opacity,
    translateY,
    scale,
    navStyle,
    shimmerTranslateX,
    shimmerOpacity,
    shimmerStyle,
  };
}
