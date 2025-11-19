'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
  type AnimatedStyle,
} from '@petspark/motion';
import { useEffect, useCallback } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseNewMessageDropOptions {
  isNew?: boolean;
  delay?: number;
  dropHeight?: number;
  bounceIntensity?: number;
}

export interface UseNewMessageDropReturn {
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  glowRadius: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  glowStyle: ReturnType<typeof useAnimatedStyle>;
  trigger: () => void;
}

const DEFAULT_DROP_HEIGHT = -50;
const DEFAULT_BOUNCE_INTENSITY = 15;
const DEFAULT_DELAY = 0;

export function useNewMessageDrop(options: UseNewMessageDropOptions = {}): UseNewMessageDropReturn {
  const {
    isNew = false,
    delay = DEFAULT_DELAY,
    dropHeight = DEFAULT_DROP_HEIGHT,
    bounceIntensity = DEFAULT_BOUNCE_INTENSITY,
  } = options;

  const translateY = useSharedValue(isNew ? dropHeight : 0);
  const scale = useSharedValue(isNew ? 0.8 : 1);
  const opacity = useSharedValue(isNew ? 0 : 1);
  const glowOpacity = useSharedValue(0);
  const glowRadius = useSharedValue(0);

  const trigger = useCallback(() => {
    translateY.value = withDelay(
      delay,
      withSequence(
        withSpring(0, {
          damping: 20,
          stiffness: 400,
        }),
        withSpring(bounceIntensity, {
          damping: 15,
          stiffness: 500,
        }),
        withSpring(0, springConfigs.smooth)
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, {
          damping: 20,
          stiffness: 400,
        }),
        withSpring(1.05, {
          damping: 15,
          stiffness: 500,
        }),
        withSpring(1, springConfigs.smooth)
      )
    );

    opacity.value = withDelay(delay, withSpring(1, springConfigs.smooth));

    glowOpacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(200, withTiming(0, timingConfigs.fast))
      )
    );

    glowRadius.value = withDelay(
      delay,
      withSequence(
        withTiming(30, timingConfigs.fast),
        withDelay(200, withTiming(0, timingConfigs.fast))
      )
    );
  }, [delay, dropHeight, bounceIntensity, translateY, scale, opacity, glowOpacity, glowRadius]);

  useEffect(() => {
    if (isNew) {
      trigger();
    }
  }, [isNew, trigger]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const radius = interpolate(glowRadius.value, [0, 30], [0, 30], Extrapolation.CLAMP);

    return {
      opacity: glowOpacity.value,
      boxShadow: `0 0 ${radius}px rgba(59, 130, 246, 0.6)`,
    };
  });

  return {
    translateY,
    scale,
    opacity,
    glowOpacity,
    glowRadius,
    animatedStyle,
    glowStyle,
    trigger,
  };
}
