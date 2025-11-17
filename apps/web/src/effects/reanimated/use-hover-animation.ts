'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from '@petspark/motion';
import { springConfigs, timingConfigs } from './transitions';
import type { CSSProperties } from 'react';

export interface UseHoverAnimationOptions {
  scale?: number;
  duration?: number;
  enabled?: boolean;
}

export interface UseHoverAnimationReturn {
  animatedStyle: CSSProperties;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
}

export function useHoverAnimation(options: UseHoverAnimationOptions = {}): UseHoverAnimationReturn {
  const {
    scale: hoverScale = 1.02,
    duration = timingConfigs.fast.duration,
    enabled = true,
  } = options;

  const scale = useSharedValue(1);
  const isHovered = useSharedValue(0);
  const isPressed = useSharedValue(0);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    isHovered.value = 1;
    scale.value = withSpring(hoverScale, springConfigs.smooth);
  }, [enabled, hoverScale, isHovered, scale]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    isHovered.value = 0;
    scale.value = withSpring(1, springConfigs.smooth);
  }, [enabled, isHovered, scale]);

  const handleMouseDown = useCallback(() => {
    if (!enabled) return;
    isPressed.value = 1;
    scale.value = withTiming(0.98, { duration: duration / 2 });
  }, [enabled, duration, isPressed, scale]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;
    isPressed.value = 0;
    const targetScale = isHovered.value === 1 ? hoverScale : 1;
    scale.value = withSpring(targetScale, springConfigs.smooth);
  }, [enabled, hoverScale, isHovered, isPressed, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return {
    animatedStyle,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
  };
}
