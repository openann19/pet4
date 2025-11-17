'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  type SharedValue,
} from '@petspark/motion';
import { useEffect, useCallback } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseThreadHighlightOptions {
  isThreadMessage?: boolean;
  highlightDuration?: number;
  previewDelay?: number;
  enabled?: boolean;
}

export interface UseThreadHighlightReturn {
  scale: SharedValue<number>;
  highlightOpacity: SharedValue<number>;
  previewOpacity: SharedValue<number>;
  previewTranslateY: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  previewStyle: ReturnType<typeof useAnimatedStyle>;
  highlightStyle: ReturnType<typeof useAnimatedStyle>;
  trigger: () => void;
  dismiss: () => void;
}

const DEFAULT_IS_THREAD_MESSAGE = false;
const DEFAULT_HIGHLIGHT_DURATION = 2000;
const DEFAULT_PREVIEW_DELAY = 300;
const DEFAULT_ENABLED = true;

export function useThreadHighlight(
  options: UseThreadHighlightOptions = {}
): UseThreadHighlightReturn {
  const {
    isThreadMessage = DEFAULT_IS_THREAD_MESSAGE,
    highlightDuration = DEFAULT_HIGHLIGHT_DURATION,
    previewDelay = DEFAULT_PREVIEW_DELAY,
    enabled = DEFAULT_ENABLED,
  } = options;

  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const previewOpacity = useSharedValue(0);
  const previewTranslateY = useSharedValue(10);

  const trigger = useCallback(() => {
    if (!enabled || !isThreadMessage) {
      return;
    }

    scale.value = withSequence(
      withSpring(1.05, {
        damping: 15,
        stiffness: 400,
      }),
      withSpring(1, springConfigs.bouncy)
    );

    highlightOpacity.value = withSequence(
      withTiming(1, timingConfigs.fast),
      withDelay(highlightDuration, withTiming(0, timingConfigs.smooth))
    );

    previewOpacity.value = withDelay(previewDelay, withSpring(1, springConfigs.smooth));
    previewTranslateY.value = withDelay(previewDelay, withSpring(0, springConfigs.smooth));
  }, [
    enabled,
    isThreadMessage,
    highlightDuration,
    previewDelay,
    scale,
    highlightOpacity,
    previewOpacity,
    previewTranslateY,
  ]);

  const dismiss = useCallback(() => {
    previewOpacity.value = withTiming(0, timingConfigs.fast);
    previewTranslateY.value = withTiming(10, timingConfigs.fast);
    highlightOpacity.value = withTiming(0, timingConfigs.fast);
  }, [previewOpacity, previewTranslateY, highlightOpacity]);

  useEffect(() => {
    if (enabled && isThreadMessage) {
      trigger();

      const timeout = setTimeout(
        () => {
          dismiss();
        },
        highlightDuration + previewDelay + 1000
      );

      return () => {
        clearTimeout(timeout);
      };
    }
    return undefined;
  }, [enabled, isThreadMessage, trigger, dismiss, highlightDuration, previewDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const highlightStyle = useAnimatedStyle(() => {
    return {
      opacity: highlightOpacity.value,
      backgroundColor: `rgba(59, 130, 246, ${highlightOpacity.value * 0.2})`,
    };
  });

  const previewStyle = useAnimatedStyle(() => {
    return {
      opacity: previewOpacity.value,
      transform: [{ translateY: previewTranslateY.value }],
    };
  });

  return {
    scale,
    highlightOpacity,
    previewOpacity,
    previewTranslateY,
    animatedStyle,
    previewStyle,
    highlightStyle,
    trigger,
    dismiss,
  };
}
