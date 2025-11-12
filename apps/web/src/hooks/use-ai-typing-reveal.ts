'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect, useCallback, useState } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';

export interface UseAITypingRevealOptions {
  text: string;
  enabled?: boolean;
  typingSpeed?: number;
  cursorBlinkSpeed?: number;
  revealDelay?: number;
}

export interface UseAITypingRevealReturn {
  revealedLength: SharedValue<number>;
  cursorOpacity: SharedValue<number>;
  contentOpacity: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  cursorStyle: ReturnType<typeof useAnimatedStyle>;
  revealedText: string;
  isComplete: boolean;
  enabled: boolean;
  start: () => void;
  reset: () => void;
}

const DEFAULT_TYPING_SPEED = 30;
const DEFAULT_CURSOR_BLINK_SPEED = 500;
const DEFAULT_REVEAL_DELAY = 200;

export function useAITypingReveal(options: UseAITypingRevealOptions): UseAITypingRevealReturn {
  const {
    text,
    enabled = true,
    typingSpeed = DEFAULT_TYPING_SPEED,
    cursorBlinkSpeed = DEFAULT_CURSOR_BLINK_SPEED,
    revealDelay = DEFAULT_REVEAL_DELAY,
  } = options;

  const revealedLength = useSharedValue(0);
  const cursorOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const [revealedText, setRevealedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const start = useCallback(() => {
    if (!enabled || text.length === 0) return () => {};

    setIsComplete(false);
    setRevealedText('');
    revealedLength.value = 0;
    contentOpacity.value = 0;

    contentOpacity.value = withDelay(revealDelay, withTiming(1, timingConfigs.smooth));

    cursorOpacity.value = withDelay(
      revealDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: cursorBlinkSpeed / 2 }),
          withTiming(0, { duration: cursorBlinkSpeed / 2 })
        ),
        -1,
        false
      )
    );

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex += 1;

      if (currentIndex <= text.length) {
        revealedLength.value = withTiming(currentIndex, { duration: typingSpeed });
        setRevealedText(text.slice(0, currentIndex));
      } else {
        clearInterval(interval);
        setIsComplete(true);
        cursorOpacity.value = withTiming(0, timingConfigs.fast);
      }
    }, typingSpeed);

    return () => {
      clearInterval(interval);
    };
  }, [
    enabled,
    text,
    typingSpeed,
    cursorBlinkSpeed,
    revealDelay,
    revealedLength,
    contentOpacity,
    cursorOpacity,
  ]);

  useEffect(() => {
    if (enabled && text.length > 0) {
      const cleanup = start();
      return cleanup;
    }
    return undefined;
  }, [enabled, text, start]);

  const reset = useCallback(() => {
    revealedLength.value = 0;
    cursorOpacity.value = 1;
    contentOpacity.value = 0;
    setRevealedText('');
    setIsComplete(false);
  }, [revealedLength, cursorOpacity, contentOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(contentOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP);

    return {
      opacity,
    };
  });

  const cursorStyle = useAnimatedStyle(() => {
    return {
      opacity: cursorOpacity.value,
    };
  });

  return {
    revealedLength,
    cursorOpacity,
    contentOpacity,
    animatedStyle,
    cursorStyle,
    revealedText,
    isComplete,
    enabled,
    start,
    reset,
  };
}
