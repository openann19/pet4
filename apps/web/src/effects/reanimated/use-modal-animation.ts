'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from '@petspark/motion';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@petspark/motion';
import { motionTheme } from '@/config/motionTheme';
import type { PresenceMotion } from './types';
import { useMotionPreferences, type MotionHookOptions } from './useMotionPreferences';

export interface UseModalAnimationOptions extends MotionHookOptions {
  isVisible: boolean;
  /** Optional override for total animation duration in ms. */
  duration?: number;
  /** Optional start delay in ms. */
  delay?: number;
}

export interface UseModalAnimationReturn extends PresenceMotion<AnimatedStyle> {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<number>;
  variants: Variants;
  style: AnimatedStyle;
}

export function useModalAnimation(options: UseModalAnimationOptions): UseModalAnimationReturn {
  const {
    isVisible,
    duration,
    delay = 0,
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();
  const isOff = respectPreferences && preferences.isOff;
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;

  const baseDurationMs = duration ?? motionTheme.durations.normal;
  const effectiveDurationMs = isReduced ? motionTheme.durations.fast : baseDurationMs;

  const initialScale = motionTheme.scale.modalInitial;
  const initialOffsetY = motionTheme.distance.modalOffsetY;

  const scaleFrom = isReduced ? 1 - (1 - initialScale) * 0.5 : initialScale;
  const yFrom = isReduced ? initialOffsetY * 0.5 : initialOffsetY;

  const opacity = useMotionValue(0);
  const scale = useMotionValue(scaleFrom);
  const y = useMotionValue(yFrom);

  useEffect(() => {
    if (isOff) {
      if (isVisible) {
        opacity.set(1);
        scale.set(1);
        y.set(0);
      } else {
        opacity.set(0);
        scale.set(scaleFrom);
        y.set(yFrom);
      }
      return;
    }

    const durationSec = effectiveDurationMs / 1000;
    const delaySec = delay / 1000;

    if (isVisible) {
      void animate(opacity, 1, {
        delay: delaySec,
        duration: durationSec,
        ease: 'easeInOut',
      });
      void animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(y, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      void animate(opacity, 0, {
        duration: durationSec,
        ease: 'easeInOut',
      });
      void animate(scale, scaleFrom, {
        duration: durationSec,
        ease: 'easeInOut',
      });
      void animate(y, yFrom, {
        duration: durationSec,
        ease: 'easeInOut',
      });
    }
  }, [
    isVisible,
    isOff,
    effectiveDurationMs,
    delay,
    opacity,
    scale,
    y,
    scaleFrom,
    yFrom,
  ]);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: scaleFrom,
      y: yFrom,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: delay / 1000,
        opacity: {
          duration: effectiveDurationMs / 1000,
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

  const style: AnimatedStyle = {
    opacity,
    scale,
    y,
  };

  return {
    kind: 'presence',
    isVisible,
    animatedStyle: style,
    opacity,
    scale,
    y,
    variants,
    style,
  };
}
