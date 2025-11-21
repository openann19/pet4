import { useEffect, useMemo, useState } from 'react';
import {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type MotionStyle,
  type SharedValue,
} from '@petspark/motion';
import { motionTheme } from '@/config/motionTheme';
import type { PresenceMotion } from '@/effects/reanimated/types';
import {
  useMotionPreferences,
  type MotionHookOptions,
} from '@/effects/reanimated/useMotionPreferences';

const DEFAULT_DOT_COUNT = 3;
const DEFAULT_HIDE_DELAY = motionTheme.durations.fast;
const DEFAULT_LABEL = 'Typing…';
const DOT_STAGGER = motionTheme.durations.instant;

export type TypingIndicatorDisplayMode = 'dots' | 'static-dots' | 'text';

export interface TypingDotMotion {
  readonly id: string;
  readonly animatedStyle: MotionStyle;
}

export interface UseTypingIndicatorMotionOptions extends MotionHookOptions {
  readonly isTyping: boolean;
  readonly dotCount?: number;
  readonly hideDelayMs?: number;
  readonly label?: string;
  /**
   * Determines what to render when motion preferences are reduced/off.
   * "text" shows a static label, "static-dots" keeps dots but disables animation.
   */
  readonly reducedMode?: 'text' | 'static-dots';
}

export interface UseTypingIndicatorMotionReturn extends PresenceMotion<MotionStyle> {
  readonly dots: readonly TypingDotMotion[];
  readonly displayMode: TypingIndicatorDisplayMode;
  readonly label: string;
}

interface DotValues {
  readonly id: string;
  readonly translateY: SharedValue<number>;
  readonly opacity: SharedValue<number>;
  readonly scale: SharedValue<number>;
}

const easingInOut = Easing.inOut(Easing.ease);

export function useTypingIndicatorMotion(
  options: UseTypingIndicatorMotionOptions
): UseTypingIndicatorMotionReturn {
  const {
    isTyping,
    dotCount = DEFAULT_DOT_COUNT,
    hideDelayMs = DEFAULT_HIDE_DELAY,
    label = DEFAULT_LABEL,
    reducedMode = 'text',
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;
  const isOff = respectPreferences && preferences.isOff;

  const displayMode: TypingIndicatorDisplayMode = isOff
    ? reducedMode === 'static-dots'
      ? 'static-dots'
      : 'text'
    : isReduced
      ? reducedMode === 'static-dots'
        ? 'static-dots'
        : 'text'
      : 'dots';

  const dotValues = useMemo<DotValues[]>(
    () =>
      Array.from({ length: dotCount }, (_, index) => ({
        id: `typing-dot-${index}`,
        translateY: useSharedValue<number>(0),
        opacity: useSharedValue<number>(motionTheme.opacity.subtle),
        scale: useSharedValue<number>(1),
      })),
    [dotCount]
  );

  const [isVisible, setIsVisible] = useState<boolean>(isTyping);

  useEffect(() => {
    if (isTyping) {
      setIsVisible(true);
      return;
    }

    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, hideDelayMs);

    return () => clearTimeout(timeout);
  }, [hideDelayMs, isTyping]);

  const containerOpacity = useSharedValue(isTyping ? 1 : 0);
  const containerScale = useSharedValue(isTyping ? 1 : motionTheme.scale.press);
  const containerTranslateY = useSharedValue(isTyping ? 0 : motionTheme.distance.hoverLift);

  useEffect(() => {
    if (isOff) {
      containerOpacity.value = isTyping ? 1 : 0;
      containerScale.value = 1;
      containerTranslateY.value = 0;
      return;
    }

    const duration = isTyping ? motionTheme.durations.fast : hideDelayMs;
    const easing = isTyping ? Easing.out(Easing.ease) : easingInOut;

    containerOpacity.value = withTiming(isTyping ? 1 : 0, {
      duration,
      easing,
    });
    containerScale.value = withTiming(isTyping ? 1 : motionTheme.scale.press, {
      duration,
      easing,
    });
    containerTranslateY.value = withTiming(isTyping ? 0 : motionTheme.distance.hoverLift, {
      duration,
      easing,
    });
  }, [containerOpacity, containerScale, containerTranslateY, hideDelayMs, isOff, isTyping]);

  useEffect(() => {
    const travel = isReduced
      ? motionTheme.distance.hoverLift * 0.5
      : motionTheme.distance.hoverLift;
    const riseDuration = motionTheme.durations.fast;
    const fallDuration = motionTheme.durations.fast;

    dotValues.forEach((dot, index) => {
      if (!isTyping || displayMode !== 'dots') {
        dot.translateY.value = 0;
        dot.opacity.value =
          displayMode === 'static-dots' && isTyping
            ? motionTheme.opacity.visible
            : motionTheme.opacity.subtle;
        dot.scale.value = 1;
        return;
      }

      const delay = index * DOT_STAGGER;
      dot.translateY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-travel, {
              duration: riseDuration,
              easing: easingInOut,
            }),
            withTiming(0, {
              duration: fallDuration,
              easing: easingInOut,
            })
          ),
          -1,
          false
        )
      );

      dot.opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(motionTheme.opacity.visible, {
              duration: riseDuration,
              easing: easingInOut,
            }),
            withTiming(motionTheme.opacity.subtle, {
              duration: fallDuration,
              easing: easingInOut,
            })
          ),
          -1,
          true
        )
      );

      dot.scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(motionTheme.scale.hover, {
              duration: riseDuration,
              easing: easingInOut,
            }),
            withTiming(motionTheme.scale.press, {
              duration: fallDuration,
              easing: easingInOut,
            })
          ),
          -1,
          true
        )
      );
    });
  }, [displayMode, dotValues, isReduced, isTyping]);

  const animatedStyle = useMemo<MotionStyle>(
    () => ({
      opacity: containerOpacity,
      scale: containerScale,
      y: containerTranslateY,
    }),
    [containerOpacity, containerScale, containerTranslateY]
  );

  const dots = useMemo<readonly TypingDotMotion[]>(
    () =>
      dotValues.map((dot) => ({
        id: dot.id,
        animatedStyle: {
          opacity: dot.opacity,
          y: dot.translateY,
          scale: dot.scale,
        },
      })),
    [dotValues]
  );

  return {
    kind: 'presence',
    isVisible,
    animatedStyle,
    dots,
    displayMode,
    label,
  };
}
