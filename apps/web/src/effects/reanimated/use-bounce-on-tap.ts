'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { useCallback } from 'react';
import type { Variants } from 'framer-motion';

export interface UseBounceOnTapOptions {
  scale?: number;
  duration?: number;
  damping?: number;
  stiffness?: number;
  onPress?: () => void;
  hapticFeedback?: boolean;
}

export interface UseBounceOnTapReturn {
  scale: MotionValue<number>;
  variants: Variants;
  handlePress: () => void;
}

const DEFAULT_SCALE = 0.95;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 400;

export function useBounceOnTap(options: UseBounceOnTapOptions = {}): UseBounceOnTapReturn {
  const {
    scale: scaleValue = DEFAULT_SCALE,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    onPress,
    hapticFeedback = true,
  } = options;

  const scale = useMotionValue(1);

  const variants: Variants = {
    rest: {
      scale: 1,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
    tap: {
      scale: scaleValue,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
  };

  const handlePress = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact('light');
    }

    animate(scale, scaleValue, {
      type: 'spring',
      damping,
      stiffness,
    }).then(() => {
      animate(scale, 1, {
        type: 'spring',
        damping,
        stiffness,
      });
    });

    onPress?.();
  }, [scale, scaleValue, damping, stiffness, onPress, hapticFeedback]);

  return {
    scale,
    variants,
    handlePress,
  };
}
