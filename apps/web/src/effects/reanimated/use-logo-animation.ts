'use client';

import {
  useSharedValue,
  use
  withRepeat,
  withSequence,
  withTiming,
} from '@petspark/motion';
import { useEffect } from 'react';
import type  from '@petspark/motion';

export interface UseLogoAnimationReturn {
  scale: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
}

export function useLogoAnimation(): UseLogoAnimationReturn {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250 }),
        withTiming(1.12, { duration: 1250 }),
        withTiming(1, { duration: 1250 })
      ),
      -1,
      true
    );
  }, [scale]);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  }) as AnimatedStyle;

  return {
    scale,
    style,
  };
}

export interface UseLogoGlowReturn {
  scale: ReturnType<typeof useSharedValue<number>>;
  opacity: ReturnType<typeof useSharedValue<number>>;
  style: AnimatedStyle;
}

export function useLogoGlow(): UseLogoGlowReturn {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(1.5, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
        withTiming(0.7, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return {
    scale,
    opacity,
    style,
  };
}
