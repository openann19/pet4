'use client';

import {
  useMotionValue,
  type MotionValue,
  type Variants,
  type MotionStyle,
} from '@petspark/motion';
import { useCallback } from 'react';
import { motionTheme } from '@/config/motionTheme';
import type { InteractionMotion } from './types';
import { useMotionPreferences, type MotionHookOptions } from './useMotionPreferences';

export interface UseHoverLiftOptions extends MotionHookOptions {
  scale?: number;
  translateY?: number;
  damping?: number;
  stiffness?: number;
}

export interface UseHoverLiftReturn extends InteractionMotion<MotionStyle> {
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  variants: Variants;
  handleEnter: () => void;
  handleLeave: () => void;
}

export function useHoverLift(options: UseHoverLiftOptions = {}): UseHoverLiftReturn {
  const {
    scale: customScale,
    translateY: customTranslateY,
    damping: customDamping,
    stiffness: customStiffness,
    preferences: overridePreferences,
    respectPreferences = true,
  } = options;

  const preferences = overridePreferences ?? useMotionPreferences();

  const isOff = respectPreferences && preferences.isOff;
  const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;

  const baseScale = customScale ?? motionTheme.scale.hover;
  const baseTranslateY = customTranslateY ?? -motionTheme.distance.hoverLift;
  const baseSpring = motionTheme.spring.responsive;

  const scaleValue = isReduced ? 1 + (baseScale - 1) * 0.5 : baseScale;
  const translateYValue = isReduced ? baseTranslateY * 0.5 : baseTranslateY;

  const damping = customDamping ?? (isReduced ? motionTheme.spring.settled.damping : baseSpring.damping);
  const stiffness =
    customStiffness ?? (isReduced ? motionTheme.spring.settled.stiffness : baseSpring.stiffness);

  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);

  const animatedStyle: MotionStyle = {
    scale,
    y: translateY,
  };

  const restVariant = {
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping,
      stiffness,
    },
  };

  const hoverVariant = isOff
    ? restVariant
    : {
        scale: scaleValue,
        y: translateYValue,
        transition: {
          type: 'spring' as const,
          damping,
          stiffness,
        },
      };

  const variants: Variants = {
    rest: restVariant,
    hover: hoverVariant,
  };

  const handleEnter = useCallback(() => {
    if (isOff) return;
    scale.set(scaleValue);
    translateY.set(translateYValue);
  }, [isOff, scale, translateY, scaleValue, translateYValue]);

  const handleLeave = useCallback(() => {
    if (isOff) return;
    scale.set(1);
    translateY.set(0);
  }, [isOff, scale, translateY]);

  return {
    kind: 'interaction',
    animatedStyle,
    scale,
    translateY,
    variants,
    handleEnter,
    handleLeave,
    onHoverIn: handleEnter,
    onHoverOut: handleLeave,
  };
}
