'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { Variants } from 'framer-motion';
import { isTruthy } from '@petspark/shared';

export interface UseShimmerOptions {
  duration?: number;
  delay?: number;
  shimmerWidth?: number;
  enabled?: boolean;
}

export interface UseShimmerReturn {
  variants: Variants;
  translateX: MotionValue<number>;
  opacity: MotionValue<number>;
  start: () => void;
  stop: () => void;
}

const DEFAULT_DURATION = 2000;
const DEFAULT_DELAY = 0;
const DEFAULT_SHIMMER_WIDTH = 200;

export function useShimmer(options: UseShimmerOptions = {}): UseShimmerReturn {
  const {
    duration = DEFAULT_DURATION,
    delay = DEFAULT_DELAY,
    shimmerWidth = DEFAULT_SHIMMER_WIDTH,
    enabled = true,
  } = options;

  const translateX = useMotionValue(-shimmerWidth);
  const opacity = useMotionValue(0.3);

  const start = () => {
    animate(translateX, shimmerWidth, {
      duration: duration / 1000,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    });
    animate(opacity, 0.3, {
      duration: (duration / 2) / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'reverse',
    });
  };

  const stop = () => {
    translateX.set(-shimmerWidth);
    opacity.set(0.3);
  };

  useEffect(() => {
    if (isTruthy(enabled)) {
      const timer = setTimeout(() => {
        start();
      }, delay);
      return () => {
        clearTimeout(timer);
        stop();
      };
    } else {
      stop();
      return undefined;
    }
  }, [enabled, delay, translateX, opacity]);

  const variants: Variants = {
    shimmer: {
      x: [-shimmerWidth, shimmerWidth],
      opacity: [0.3, 0.3],
      transition: {
        x: {
          duration: duration / 1000,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        },
        opacity: {
          duration: (duration / 2) / 1000,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        },
      },
    },
  };

  return {
    variants,
    translateX,
    opacity,
    start,
    stop,
  };
}
