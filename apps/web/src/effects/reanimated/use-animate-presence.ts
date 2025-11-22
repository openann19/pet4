'use client';

import { useEffect, useState, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  type SharedValue,
  type Variants,
  type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { motionTheme } from '@/config/motionTheme';
import type { PresenceMotion } from './types';
import { useMotionPreferences, type MotionHookOptions } from './useMotionPreferences';

export interface UseAnimatePresenceOptions extends MotionHookOptions {
  isVisible: boolean;
  initial?: boolean;
  exitDuration?: number;
  enterDuration?: number;
  exitTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  enterTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  onExitComplete?: () => void;
  enabled?: boolean;
}

export interface UseAnimatePresenceReturn extends PresenceMotion<AnimatedStyle> {
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  shouldRender: boolean;
  variants: Variants;
}

export function useAnimatePresence(options: UseAnimatePresenceOptions): UseAnimatePresenceReturn {
  const {
    isVisible,
    initial = false,
    exitDuration,
    enterDuration,
    exitTransition = 'fade',
    enterTransition = 'fade',
    onExitComplete,
    enabled = true,
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();
  const isOff = respectPreferences && preferences.isOff;
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;

  const baseEnterDurationMs = enterDuration ?? motionTheme.durations.normal;
  const baseExitDurationMs = exitDuration ?? motionTheme.durations.fast;

  const effectiveEnterDurationMs = isReduced ? motionTheme.durations.fast : baseEnterDurationMs;
  const effectiveExitDurationMs = isReduced ? motionTheme.durations.fast : baseExitDurationMs;

  const slideDistanceBase = motionTheme.distance.listStaggerY;
  const slideDistance = isReduced ? slideDistanceBase * 0.5 : slideDistanceBase;

  const initialScale = motionTheme.scale.presenceInitial;
  const exitScale = motionTheme.scale.presenceExit;

  const opacity = useSharedValue(initial && isVisible ? 1 : 0);
  const scale = useSharedValue(initial && isVisible ? 1 : initialScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(initial && isVisible ? 0 : -slideDistance);

  const [shouldRender, setShouldRender] = useState(initial && isVisible);
  const exitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = undefined;
    }

    if (!enabled || isOff) {
      setShouldRender(isVisible);
      opacity.value = isVisible ? 1 : 0;
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;

      if (!isVisible) {
        onExitComplete?.();
      }

      return;
    }

    if (isVisible) {
      setShouldRender(true);

      const enterTiming = {
        duration: effectiveEnterDurationMs,
        easing: timingConfigs.smooth.easing,
      };

      const enterScaleSpring =
        enterTransition === 'scale' && !isReduced ? springConfigs.bouncy : springConfigs.smooth;

      opacity.value = withTiming(1, enterTiming);
      scale.value = withSpring(1, enterScaleSpring);
      translateX.value = withSpring(0, springConfigs.smooth);
      translateY.value = withSpring(0, springConfigs.smooth);
    } else {
      const exitTiming = {
        duration: effectiveExitDurationMs,
        easing: timingConfigs.fast.easing,
      };

      opacity.value = withTiming(0, exitTiming);

      let scaleTarget = isReduced ? 1 : initialScale;
      let translateXTarget = 0;
      let translateYTarget = 0;

      switch (exitTransition) {
        case 'scale':
          scaleTarget = isReduced ? initialScale : exitScale;
          break;
        case 'slideUp':
          translateYTarget = -slideDistance;
          scaleTarget = 1;
          break;
        case 'slideDown':
          translateYTarget = slideDistance;
          scaleTarget = 1;
          break;
        case 'slideLeft':
          translateXTarget = -slideDistance;
          scaleTarget = 1;
          break;
        case 'slideRight':
          translateXTarget = slideDistance;
          scaleTarget = 1;
          break;
        case 'fade':
        default:
          break;
      }

      scale.value = withTiming(scaleTarget, exitTiming);
      translateX.value = withTiming(translateXTarget, exitTiming);
      translateY.value = withTiming(translateYTarget, exitTiming);

      exitTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        onExitComplete?.();
      }, effectiveExitDurationMs);
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = undefined;
      }
    };
  }, [
    enabled,
    enterTransition,
    exitTransition,
    effectiveEnterDurationMs,
    effectiveExitDurationMs,
    exitScale,
    initialScale,
    isOff,
    isReduced,
    isVisible,
    onExitComplete,
    opacity,
    scale,
    slideDistance,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number>[] = [];

    if (translateX.value !== 0) {
      transforms.push({ translateX: translateX.value });
    }

    if (translateY.value !== 0) {
      transforms.push({ translateY: translateY.value });
    }

    if (scale.value !== 1) {
      transforms.push({ scale: scale.value });
    }

    return {
      opacity: opacity.value,
      transform: transforms.length > 0 ? transforms : undefined,
    };
  });

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: isReduced ? 1 : initialScale,
      x: 0,
      y: -slideDistance,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        opacity: {
          duration: effectiveEnterDurationMs / 1000,
          ease: 'easeInOut',
        },
        scale: {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        },
        y: {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        },
      },
    },
  };

  return {
    kind: 'presence',
    isVisible,
    animatedStyle,
    opacity,
    scale,
    translateX,
    translateY,
    shouldRender,
    variants,
  };
}
