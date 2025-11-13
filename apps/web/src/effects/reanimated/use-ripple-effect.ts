/**
 * Ripple Effect Hook
 * Material-style ripple effect with smooth spring animations
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from '@petspark/motion';
import { useState, useCallback } from 'react';

export interface UseRippleEffectOptions {
  duration?: number;
  color?: string;
  opacity?: number;
}

export interface RippleState {
  x: number;
  y: number;
  id: number;
}

export function useRippleEffect(options: UseRippleEffectOptions = {}) {
  const { duration = 600, color = 'rgba(255, 255, 255, 0.5)', opacity = 0.5 } = options;

  const [ripples, setRipples] = useState<RippleState[]>([]);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(opacity);

  const addRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      rippleScale.value = 0;
      rippleOpacity.value = opacity;

      rippleScale.value = withTiming(4, { duration });
      rippleOpacity.value = withSequence(
        withTiming(opacity, { duration: duration / 3 }),
        withTiming(0, { duration: (duration * 2) / 3 })
      );

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, duration);
    },
    [duration, opacity]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return {
    ripples,
    addRipple,
    animatedStyle,
    color,
  };
}
