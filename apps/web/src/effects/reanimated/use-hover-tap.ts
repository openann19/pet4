'use client';

import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, animate, type SharedValue } from '@petspark/motion';
import type { CSSProperties } from 'react';

export interface UseHoverTapOptions {
  hoverScale?: number;
  tapScale?: number;
  damping?: number;
  stiffness?: number;
  onPress?: () => void;
}

export interface UseHoverTapReturn {
  scale: SharedValue<number>;
  animatedStyle: CSSProperties;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handlePress: () => void;
}

const DEFAULT_HOVER_SCALE = 1.1;
const DEFAULT_TAP_SCALE = 0.95;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 400;

/**
 * Hook for hover and tap interactions on buttons/icons
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useHoverTap(options: UseHoverTapOptions = {}): UseHoverTapReturn {
  const {
    hoverScale = DEFAULT_HOVER_SCALE,
    tapScale = DEFAULT_TAP_SCALE,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    onPress,
  } = options;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.get() }],
    };
  });

  const handleMouseEnter = useCallback(() => {
    void animate(scale, hoverScale, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [scale, hoverScale, damping, stiffness]);

  const handleMouseLeave = useCallback(() => {
    void animate(scale, 1, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [scale, damping, stiffness]);

  const handlePress = useCallback(() => {
    void animate(scale, tapScale, {
      type: 'spring',
      damping,
      stiffness,
    }).then(() => {
      void animate(scale, 1, {
        type: 'spring',
        damping,
        stiffness,
      });
    });
    onPress?.();
  }, [scale, tapScale, damping, stiffness, onPress]);

  return {
    scale,
    animatedStyle,
    handleMouseEnter,
    handleMouseLeave,
    handlePress,
  };
}
