'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback } from 'react';
import type { Variants } from 'framer-motion';

export interface UseMagneticEffectOptions {
  strength?: number;
  damping?: number;
  stiffness?: number;
  enabled?: boolean;
}

export interface UseMagneticEffectReturn {
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  variants: Variants;
  handleMove: (x: number, y: number) => void;
  handleLeave: () => void;
}

const DEFAULT_STRENGTH = 20;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 150;

export function useMagneticEffect(options: UseMagneticEffectOptions = {}): UseMagneticEffectReturn {
  const {
    strength = DEFAULT_STRENGTH,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
  } = options;

  const translateX = useMotionValue(0);
  const translateY = useMotionValue(0);

  const variants = {
    rest: {
      x: 0,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping,
        stiffness,
      },
    },
  } satisfies Variants;

  const handleMove = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;

      const centerX = 0;
      const centerY = 0;
      const deltaX = x - centerX;
      const deltaY = y - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 0) {
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;
        const magneticX = normalizedX * strength;
        const magneticY = normalizedY * strength;

        animate(translateX, magneticX, {
          type: 'spring',
          damping,
          stiffness,
        });
        animate(translateY, magneticY, {
          type: 'spring',
          damping,
          stiffness,
        });
      }
    },
    [enabled, strength, damping, stiffness, translateX, translateY]
  );

  const handleLeave = useCallback(() => {
    if (!enabled) return;
    animate(translateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(translateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [enabled, damping, stiffness, translateX, translateY]);

  return {
    translateX,
    translateY,
    variants,
    handleMove,
    handleLeave,
  };
}
