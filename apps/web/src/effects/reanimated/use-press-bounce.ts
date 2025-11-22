'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
  type Variants,
  type MotionStyle,
} from '@petspark/motion';
import { useCallback } from 'react';
import { motionTheme } from '@/config/motionTheme';
import type { InteractionMotion } from './types';
import { useMotionPreferences, type MotionHookOptions } from './useMotionPreferences';
import { haptics } from '@/lib/haptics';

export interface UsePressBounceOptions extends MotionHookOptions {
  /** Optional override for press scale; defaults to motionTheme.scale.press. */
  scale?: number;
  /** Enable or disable haptic feedback on press. Defaults to true. */
  hapticFeedback?: boolean;
}

export interface UsePressBounceReturn extends InteractionMotion<MotionStyle> {
  scale: MotionValue<number>;
  variants: Variants;
}

export function usePressBounce(options: UsePressBounceOptions = {}): UsePressBounceReturn {
  const {
    scale: customScale,
    hapticFeedback = true,
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();

  const isOff = respectPreferences && preferences.isOff;
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;

  const baseScale = customScale ?? motionTheme.scale.press;
  const spring = isReduced ? motionTheme.spring.settled : motionTheme.spring.bouncy;

  const scaleValue = isReduced ? 1 + (baseScale - 1) * 0.5 : baseScale;

  const scale = useMotionValue(1);

  const animatedStyle: MotionStyle = {
    scale,
  };

  const restVariant = {
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: spring.damping,
      stiffness: spring.stiffness,
    },
  };

  const tapVariant = isOff
    ? restVariant
    : {
        scale: scaleValue,
        transition: {
          type: 'spring' as const,
          damping: spring.damping,
          stiffness: spring.stiffness,
        },
      };

  const variants: Variants = {
    rest: restVariant,
    tap: tapVariant,
  };

  const handlePressIn = useCallback(() => {
    if (isOff) return;
    if (hapticFeedback) {
      haptics.impact('light');
    }
    scale.set(scaleValue);
  }, [hapticFeedback, isOff, scale, scaleValue]);

  const handlePressOut = useCallback(() => {
    if (isOff) return;
    void animate(scale, 1, {
      type: 'spring',
      damping: spring.damping,
      stiffness: spring.stiffness,
    });
  }, [isOff, scale, spring.damping, spring.stiffness]);

  return {
    kind: 'interaction',
    animatedStyle,
    scale,
    variants,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    onHoverIn: undefined,
    onHoverOut: undefined,
  };
}
