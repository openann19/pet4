'use client';

import { useEffect, useCallback } from 'react';
import { useMotionValue, animate, type MotionValue, type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from './transitions';
import type  from './animated-view';

export interface UseScaleAnimationOptions {
  initial?: boolean;
  initialScale?: number;
  duration?: number;
  enabled?: boolean;
  useSpring?: boolean;
}

export interface UseScaleAnimationReturn {
  animatedStyle: AnimatedStyle;
  scale: MotionValue<number>;
  scaleIn: () => void;
  scaleOut: () => void;
  toggle: () => void;
}

export function useScaleAnimation(options: UseScaleAnimationOptions = {}): UseScaleAnimationReturn {
  const {
    initial = true,
    initialScale = 0.95,
    duration = timingConfigs.smooth.duration,
    enabled = true,
    useSpring = false,
  } = options;

  const scale = useMotionValue(enabled ? (initial ? 1 : initialScale) : 1);

  const scaleIn = useCallback(() => {
    if (!enabled) return;
    if (useSpring) {
      animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(scale, 1, { duration: (duration ?? 300) / 1000 });
    }
  }, [enabled, useSpring, scale, duration]);

  const scaleOut = useCallback(() => {
    if (!enabled) return;
    if (useSpring) {
      animate(scale, initialScale, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(scale, initialScale, { duration: (duration ?? 300) / 1000 });
    }
  }, [enabled, useSpring, scale, initialScale, duration]);

  const toggle = useCallback(() => {
    if (scale.get() > 0.9) {
      scaleOut();
    } else {
      scaleIn();
    }
  }, [scale, scaleIn, scaleOut]);

  useEffect(() => {
    if (!enabled) {
      scale.set(1);
      return;
    }
    if (initial) {
      scaleIn();
    } else {
      scaleOut();
    }
  }, [enabled, initial, scaleIn, scaleOut, scale]);

  const animatedStyle: AnimatedStyle = {
    transform: [{ scale }],
  };

  return {
    animatedStyle,
    scale,
    scaleIn,
    scaleOut,
    toggle,
  };
}
