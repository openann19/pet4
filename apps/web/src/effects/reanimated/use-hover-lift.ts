'use client';

import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

export interface UseHoverLiftOptions {
  scale?: number;
  translateY?: number;
  damping?: number;
  stiffness?: number;
}

export interface UseHoverLiftReturn {
  scale: SharedValue<number>;
  translateY: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  handleEnter: () => void;
  handleLeave: () => void;
}

const DEFAULT_SCALE = 1.05;
const DEFAULT_TRANSLATE_Y = -8;
const DEFAULT_DAMPING = 25;
const DEFAULT_STIFFNESS = 400;

export function useHoverLift(options: UseHoverLiftOptions = {}): UseHoverLiftReturn {
  const {
    scale: scaleValue = DEFAULT_SCALE,
    translateY: translateYValue = DEFAULT_TRANSLATE_Y,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
  } = options;

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  }) as AnimatedStyle;

  const handleEnter = useCallback(() => {
    scale.value = withSpring(scaleValue, { damping, stiffness });
    translateY.value = withSpring(translateYValue, { damping, stiffness });
  }, [scale, translateY, scaleValue, translateYValue, damping, stiffness]);

  const handleLeave = useCallback(() => {
    scale.value = withSpring(1, { damping, stiffness });
    translateY.value = withSpring(0, { damping, stiffness });
  }, [scale, translateY, damping, stiffness]);

  return {
    scale,
    translateY,
    animatedStyle,
    handleEnter,
    handleLeave,
  };
}
