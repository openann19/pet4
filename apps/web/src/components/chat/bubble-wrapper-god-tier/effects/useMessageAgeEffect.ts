'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  _Extrapolation,
} from '@petspark/motion';
import { useMemo, useEffect } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';

export interface UseMessageAgeEffectOptions {
  timestamp: number | string;
  enabled?: boolean;
  fadeStartAge?: number;
  fadeEndAge?: number;
  opacityMin?: number;
  scaleMin?: number;
}

export interface UseMessageAgeEffectReturn {
  opacity: number;
  scale: number;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_FADE_START_AGE = 86400000;
const DEFAULT_FADE_END_AGE = 604800000;
const DEFAULT_OPACITY_MIN = 0.6;
const DEFAULT_SCALE_MIN = 0.98;

function getMessageAge(timestamp: number | string): number {
  const timestampMs = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return Date.now() - timestampMs;
}

export function useMessageAgeEffect(
  options: UseMessageAgeEffectOptions
): UseMessageAgeEffectReturn {
  const {
    timestamp,
    enabled = DEFAULT_ENABLED,
    fadeStartAge = DEFAULT_FADE_START_AGE,
    fadeEndAge = DEFAULT_FADE_END_AGE,
    opacityMin = DEFAULT_OPACITY_MIN,
    scaleMin = DEFAULT_SCALE_MIN,
  } = options;

  const age = useMemo(() => {
    if (!enabled) {
      return 0;
    }
    return getMessageAge(timestamp);
  }, [timestamp, enabled]);

  const opacity = useSharedValue<number>(1);
  const scale = useSharedValue<number>(1);

  useEffect(() => {
    if (!enabled || age < fadeStartAge) {
      opacity.value = withTiming(1, timingConfigs.fast);
      scale.value = withTiming(1, timingConfigs.fast);
      return;
    }

    const progress = Math.min((age - fadeStartAge) / (fadeEndAge - fadeStartAge), 1);
    const targetOpacity = interpolate(progress, [0, 1], [1, opacityMin], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const targetScale = interpolate(progress, [0, 1], [1, scaleMin], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    opacity.value = withTiming(targetOpacity, timingConfigs.smooth);
    scale.value = withTiming(targetScale, timingConfigs.smooth);
  }, [age, enabled, fadeStartAge, fadeEndAge, opacityMin, scaleMin, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return {
    opacity: opacity.value,
    scale: scale.value,
    animatedStyle,
  };
}
