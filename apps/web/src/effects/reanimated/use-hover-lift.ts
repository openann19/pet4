'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from '@petspark/motion';
import { useCallback } from 'react';

export interface UseHoverLiftOptions {
  scale?: number;
  translateY?: number;
  damping?: number;
  stiffness?: number;
}

export interface UseHoverLiftReturn {
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  variants: Variants;
  handleEnter: () => void;
  handleLeave: () => void;
}

const DEFAULT_SCALE = 1.05;
const DEFAULT_TRANSLATE_Y = -8;
const DEFAULT_DAMPING = 25;
const DEFAULT_STIFFNESS = 400;

export function useHoverLift(options: UseHoverLiftOptions = {}): UseHoverLiftReturn {
  const {
    scale: scaleValue = DEFAULT_SCALE,
    translateY: translateYValue = DEFAULT_TRANSLATE_Y,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
  } = options;

  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);

  const variants: Variants = {
    rest: {
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
    hover: {
      scale: scaleValue,
      y: translateYValue,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
  };

  const handleEnter = useCallback(() => {
    animate(scale, scaleValue, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(translateY, translateYValue, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [scale, translateY, scaleValue, translateYValue, damping, stiffness]);

  const handleLeave = useCallback(() => {
    animate(scale, 1, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(translateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [scale, translateY, damping, stiffness]);

  return {
    scale,
    translateY,
    variants,
    handleEnter,
    handleLeave,
  };
}
