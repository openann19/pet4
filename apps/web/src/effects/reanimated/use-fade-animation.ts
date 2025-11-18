
import { useEffect, useCallback } from 'react';
import { useMotionValue, animate, type MotionValue } from '@petspark/motion';
import { springConfigs, timingConfigs } from './transitions';
import type  from './animated-view';


export interface UseFadeAnimationOptions {
  initial?: boolean;
  duration?: number;
  enabled?: boolean;
  useSpring?: boolean;
}


export interface UseFadeAnimationReturn {
  animatedStyle: AnimatedStyle;
  opacity: MotionValue<number>;
  fadeIn: () => void;
  fadeOut: () => void;
  toggle: () => void;
}


export function useFadeAnimation(options: UseFadeAnimationOptions = {}): UseFadeAnimationReturn {
  const {
    initial = true,
    duration = timingConfigs.smooth.duration,
    enabled = true,
    useSpring = false,
  } = options;

  const opacity = useMotionValue(enabled ? (initial ? 1 : 0) : 1);

  const fadeIn = useCallback(() => {
    if (!enabled) return;
    if (useSpring) {
      animate(opacity, 1, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(opacity, 1, { duration: (duration ?? 300) / 1000 });
    }
  }, [enabled, useSpring, opacity, duration]);

  const fadeOut = useCallback(() => {
    if (!enabled) return;
    if (useSpring) {
      animate(opacity, 0, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(opacity, 0, { duration: (duration ?? 300) / 1000 });
    }
  }, [enabled, useSpring, opacity, duration]);

  const toggle = useCallback(() => {
    if (opacity.get() > 0.5) {
      fadeOut();
    } else {
      fadeIn();
    }
  }, [opacity, fadeIn, fadeOut]);

  useEffect(() => {
    if (!enabled) {
      opacity.set(1);
      return;
    }
    if (initial) {
      fadeIn();
    } else {
      fadeOut();
    }
  }, [enabled, initial, fadeIn, fadeOut, opacity]);

  const animatedStyle: AnimatedStyle = {
    opacity,
  };

  return {
    animatedStyle,
    opacity,
    fadeIn,
    fadeOut,
    toggle,
  };
}
