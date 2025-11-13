'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from '@petspark/motion';
import { useEffect } from 'react';

export interface UseTypingIndicatorOptions {
  enabled?: boolean;
  dotCount?: number;
  animationDuration?: number;
  dotSize?: number;
}

export interface UseTypingIndicatorReturn {
  dotStyles: ReturnType<typeof useAnimatedStyle>[];
  containerStyle: ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_DOT_COUNT = 3;
const DEFAULT_ANIMATION_DURATION = 1200;
const DEFAULT_DOT_SIZE = 6;

export function useTypingIndicator(
  options: UseTypingIndicatorOptions = {}
): UseTypingIndicatorReturn {
  const {
    enabled = DEFAULT_ENABLED,
    dotCount = DEFAULT_DOT_COUNT,
    animationDuration = DEFAULT_ANIMATION_DURATION,
    dotSize = DEFAULT_DOT_SIZE,
  } = options;

  const scales = Array.from({ length: dotCount }, () => useSharedValue(1));
  const opacities = Array.from({ length: dotCount }, () => useSharedValue(0.5));

  useEffect(() => {
    if (!enabled) {
      scales.forEach((scale) => {
        scale.value = 1;
      });
      opacities.forEach((opacity) => {
        opacity.value = 0.5;
      });
      return;
    }

    scales.forEach((scale, index) => {
      const delay = index * 150;
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.4, {
              duration: animationDuration / 2,
              easing: Easing.out(Easing.ease),
            }),
            withTiming(1, {
              duration: animationDuration / 2,
              easing: Easing.in(Easing.ease),
            })
          ),
          -1,
          false
        )
      );
    });

    opacities.forEach((opacity, index) => {
      const delay = index * 150;
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: animationDuration / 2,
              easing: Easing.out(Easing.ease),
            }),
            withTiming(0.5, {
              duration: animationDuration / 2,
              easing: Easing.in(Easing.ease),
            })
          ),
          -1,
          false
        )
      );
    });
  }, [enabled, animationDuration, scales, opacities]);

  const dotStyles = scales.map((scale, index) => {
    return useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: opacities[index]?.value ?? 0.5,
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
      };
    });
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: enabled ? 1 : 0.5,
    };
  });

  return {
    dotStyles,
    containerStyle,
  };
}
