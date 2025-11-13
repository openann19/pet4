'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { Variants } from 'framer-motion';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseStaggeredContainerOptions {
  delay?: number;
  staggerDelay?: number;
}

export interface UseStaggeredContainerReturn {
  opacity: MotionValue<number>;
  x: MotionValue<number>;
  variants: Variants;
}

export function useStaggeredContainer(
  options: UseStaggeredContainerOptions = {}
): UseStaggeredContainerReturn {
  const { delay = 0.2, staggerDelay = 0.1 } = options;

  const opacity = useMotionValue(0);
  const x = useMotionValue(20);

  useEffect(() => {
    const delayMs = delay * 1000;
    animate(opacity, 1, {
      delay: delayMs / 1000,
      duration: 0.4,
      ease: 'easeInOut',
    });
    animate(x, 0, {
      delay: delayMs / 1000,
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [delay, staggerDelay, opacity, x]);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: 20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: delay,
        opacity: {
          duration: 0.4,
          ease: 'easeInOut',
        },
        x: {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
          delay: delay,
        },
      },
    },
  };

  return {
    opacity,
    x,
    variants,
  };
}
