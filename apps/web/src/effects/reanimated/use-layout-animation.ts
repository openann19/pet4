'use client';

import { useEffect, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@petspark/motion';

export interface UseLayoutAnimationOptions {
  enabled?: boolean;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  onLayoutChange?: () => void;
}

export interface UseLayoutAnimationReturn {
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: SharedValue<number>;
  height: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  measureLayout: (element: HTMLElement | null) => void;
}

export function useLayoutAnimation(
  options: UseLayoutAnimationOptions = {}
): UseLayoutAnimationReturn {
  const { enabled = true, springConfig = springConfigs.smooth, onLayoutChange } = options;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const previousLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const measureLayout = (element: HTMLElement | null): void => {
    if (!element || !enabled) return;

    const rect = element.getBoundingClientRect();
    const newLayout = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const prevLayout = previousLayoutRef.current;

    if (!prevLayout) {
      x.value = newLayout.x;
      y.value = newLayout.y;
      width.value = newLayout.width;
      height.value = newLayout.height;
      previousLayoutRef.current = newLayout;
      return;
    }

    if (
      prevLayout.x !== newLayout.x ||
      prevLayout.y !== newLayout.y ||
      prevLayout.width !== newLayout.width ||
      prevLayout.height !== newLayout.height
    ) {
      x.value = withSpring(newLayout.x, springConfig);
      y.value = withSpring(newLayout.y, springConfig);
      width.value = withSpring(newLayout.width, springConfig);
      height.value = withSpring(newLayout.height, springConfig);
      previousLayoutRef.current = newLayout;
      onLayoutChange?.();
    }
  };

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('ResizeObserver' in window)) {
      return;
    }

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          measureLayout(entry.target);
        }
      }
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [enabled]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, string | number>[] = [];
    
    const translateXValue = x.get();
    if (translateXValue !== 0) transforms.push({ translateX: translateXValue });
    
    const translateYValue = y.get();
    if (translateYValue !== 0) transforms.push({ translateY: translateYValue });

    return {
      transform: transforms,
      width: width.get(),
      height: height.get(),
    };
  });

  return {
    x,
    y,
    width,
    height,
    animatedStyle,
    measureLayout,
  };
}
