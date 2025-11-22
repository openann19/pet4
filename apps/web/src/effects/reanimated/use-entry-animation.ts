'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from '@petspark/motion';
import { useEffect } from 'react';
import { springConfigs, timingConfigs } from './transitions';

export interface UseEntryAnimationOptions {
  delay?: number;
  duration?: number;
  initialY?: number;
  initialOpacity?: number;
  initialScale?: number;
  enabled?: boolean;
}

export interface UseEntryAnimationReturn {
  variants: Variants;
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
  animatedStyle: {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
    scale: MotionValue<number>;
  };
}

export function useEntryAnimation(options: UseEntryAnimationOptions = {}): UseEntryAnimationReturn {
  const {
    delay = 0,
    duration = timingConfigs.smooth.duration,
    initialY = 20,
    initialOpacity = 0,
    initialScale = 0.95,
    enabled = true,
  } = options;

  const opacity = useMotionValue(enabled ? initialOpacity : 1);
  const translateY = useMotionValue(enabled ? initialY : 0);
  const scale = useMotionValue(enabled ? initialScale : 1);

  useEffect(() => {
    if (!enabled) {
      opacity.set(1);
      translateY.set(0);
      scale.set(1);
      return;
    }

    const timeoutId = setTimeout(() => {
      animate(opacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(translateY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, enabled, opacity, translateY, scale]);

  const variants: Variants = {
    hidden: {
      opacity: enabled ? initialOpacity : 1,
      y: enabled ? initialY : 0,
      scale: enabled ? initialScale : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: delay / 1000,
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  };

  return {
    variants,
    opacity,
    translateY,
    scale,
    animatedStyle: {
      opacity,
      y: translateY,
      scale,
    },
  };
}
