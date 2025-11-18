'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useSharedValue,
  use
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { springConfigs, timingConfigs } from './transitions';
import type  from './animated-view';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxDistance?: number;
  enabled?: boolean;
}

export interface UsePullToRefreshReturn {
  pullDistance: ReturnType<typeof useSharedValue<number>>;
  pullOpacity: ReturnType<typeof useSharedValue<number>>;
  pullRotation: ReturnType<typeof useSharedValue<number>>;
  pullScale: ReturnType<typeof useSharedValue<number>>;
  isRefreshing: boolean;
  animatedStyle: AnimatedStyle;
  indicatorStyle: AnimatedStyle;
  handleTouchStart: (e: globalThis.TouchEvent) => void;
  handleTouchMove: (e: globalThis.TouchEvent) => void;
  handleTouchEnd: () => void;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxDistance = 120,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const reducedMotion = useReducedMotion();
  const pullDistance = useSharedValue(0);
  const isRefreshing = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const pullOpacity = useSharedValue(0);
  const pullRotation = useSharedValue(0);
  const pullScale = useSharedValue(0.5);

  const handleTouchStart = useCallback(
    (e: globalThis.TouchEvent): void => {
      if (!enabled || !containerRef.current) return;

      if (containerRef.current.scrollTop === 0 && e.touches.length > 0 && e.touches[0]) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent): void => {
      if (!enabled || !isPulling.current || !containerRef.current) return;

      if (e.touches.length === 0 || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && diff < maxDistance) {
        pullDistance.value = diff;

        // Calculate derived values
        pullOpacity.value = interpolate(diff, [0, threshold], [0, 1], Extrapolation.CLAMP);

        pullRotation.value = interpolate(diff, [0, threshold], [0, 360], Extrapolation.CLAMP);

        pullScale.value = interpolate(diff, [0, threshold], [0.5, 1], Extrapolation.CLAMP);
      }
    },
    [enabled, maxDistance, threshold, pullDistance, pullOpacity, pullRotation, pullScale]
  );

  const handleTouchEnd = useCallback(async (): Promise<void> => {
    if (!enabled || !isPulling.current) return;
    isPulling.current = false;

    const distance = pullDistance.value;

    if (distance > threshold && !isRefreshing.current) {
      isRefreshing.current = true;

      try {
        await onRefresh();
      } finally {
        isRefreshing.current = false;
      }
    }

    // Animate back to zero
    pullDistance.value = withSpring(0, springConfigs.smooth);
    pullOpacity.value = withTiming(0, timingConfigs.fast);
    pullRotation.value = withSpring(0, springConfigs.smooth);
    pullScale.value = withSpring(0.5, springConfigs.smooth);
  }, [enabled, threshold, pullDistance, pullOpacity, pullRotation, pullScale, onRefresh]);

  const animatedStyle = useAnimatedStyle(() => {
    if (isTruthy(reducedMotion)) {
      return {
        transform: [{ translateY: 0 }],
        opacity: 0,
      };
    }

    return {
      transform: [{ translateY: pullDistance.value }],
      opacity: pullOpacity.value,
    };
  }) as AnimatedStyle;

  const indicatorStyle = useAnimatedStyle(() => {
    if (isTruthy(reducedMotion)) {
      return {
        transform: [{ rotate: '0deg' }, { scale: 0.5 }],
      };
    }

    return {
      transform: [{ rotate: `${pullRotation.value}deg` }, { scale: pullScale.value }],
    };
  }) as AnimatedStyle;

  return {
    pullDistance,
    pullOpacity,
    pullRotation,
    pullScale,
    isRefreshing: isRefreshing.current,
    animatedStyle,
    indicatorStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
