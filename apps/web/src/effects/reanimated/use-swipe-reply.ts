'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from '@petspark/motion';
import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseSwipeReplyOptions {
  onReply?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
  enabled?: boolean;
}

export interface UseSwipeReplyReturn {
  translateX: SharedValue<number>;
  opacity: SharedValue<number>;
  previewOpacity: SharedValue<number>;
  previewScale: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  previewStyle: ReturnType<typeof useAnimatedStyle>;
  handleGestureStart: () => void;
  handleGestureUpdate: (translationX: number, velocityX: number) => void;
  handleGestureEnd: (translationX: number, velocityX: number) => void;
  reset: () => void;
}

const DEFAULT_THRESHOLD = 60;
const DEFAULT_HAPTIC_FEEDBACK = true;
const DEFAULT_ENABLED = true;

export function useSwipeReply(options: UseSwipeReplyOptions = {}): UseSwipeReplyReturn {
  const {
    onReply,
    threshold = DEFAULT_THRESHOLD,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    enabled = DEFAULT_ENABLED,
  } = options;

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const previewOpacity = useSharedValue(0);
  const previewScale = useSharedValue(0.9);
  const hasTriggeredHaptic = useSharedValue(false);

  const handleGestureStart = useCallback(() => {
    if (!enabled) {
      return;
    }
    hasTriggeredHaptic.value = false;
  }, [enabled, hasTriggeredHaptic]);

  const handleGestureUpdate = useCallback(
    (translationX: number, _velocityX: number) => {
      if (!enabled) {
        return;
      }

      const clampedX = Math.max(0, translationX);
      translateX.value = clampedX;

      const progress = Math.min(clampedX / threshold, 1);
      opacity.value = interpolate(progress, [0, 1], [0, 0.3], Extrapolation.CLAMP);

      if (clampedX >= threshold && !hasTriggeredHaptic.value) {
        if (hapticFeedback) {
          haptics.selection();
        }
        hasTriggeredHaptic.value = true;
      }
    },
    [enabled, threshold, hapticFeedback, translateX, opacity, hasTriggeredHaptic]
  );

  const handleGestureEnd = useCallback(
    (translationX: number, velocityX: number) => {
      if (!enabled) {
        return;
      }

      const shouldCommit = translationX >= threshold || velocityX > 500;

      if (shouldCommit) {
        translateX.value = withSpring(threshold, springConfigs.smooth);
        opacity.value = withTiming(0.3, timingConfigs.fast);

        previewOpacity.value = withSpring(1, springConfigs.bouncy);
        previewScale.value = withSpring(1, springConfigs.bouncy);

        if (onReply) {
          onReply();
        }

        setTimeout(() => {
          reset();
        }, 2000);
      } else {
        reset();
      }
    },
    [enabled, threshold, onReply, translateX, opacity, previewOpacity, previewScale]
  );

  const reset = useCallback(() => {
    translateX.value = withSpring(0, springConfigs.smooth);
    opacity.value = withTiming(0, timingConfigs.fast);
    previewOpacity.value = withTiming(0, timingConfigs.fast);
    previewScale.value = withTiming(0.9, timingConfigs.fast);
    hasTriggeredHaptic.value = false;
  }, [translateX, opacity, previewOpacity, previewScale, hasTriggeredHaptic]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const previewStyle = useAnimatedStyle(() => {
    return {
      opacity: previewOpacity.value,
      transform: [{ scale: previewScale.value }],
    };
  });

  return {
    translateX,
    opacity,
    previewOpacity,
    previewScale,
    animatedStyle,
    previewStyle,
    handleGestureStart,
    handleGestureUpdate,
    handleGestureEnd,
    reset,
  };
}
