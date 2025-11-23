'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@petspark/motion';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('usePullToRefresh');

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  activeTab?: string;
  threshold?: number;
}

export interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  pullDistance: ReturnType<typeof useSharedValue<number>>;
  isRefreshing: boolean;
  pullOpacityStyle: AnimatedStyle;
  pullRotationStyle: AnimatedStyle;
  pullScaleStyle: AnimatedStyle;
  pullTranslateStyle: AnimatedStyle;
}

export function usePullToRefresh(options: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const { onRefresh, enabled = true, activeTab = 'feed', threshold = 80 } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistance = useSharedValue(0);

  const pullOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(pullDistance.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
    };
  }) as AnimatedStyle;

  const pullRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(
            pullDistance.value,
            [0, threshold],
            [0, 360],
            Extrapolation.CLAMP
          )}deg`,
        },
      ],
    };
  }) as AnimatedStyle;

  const pullScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(pullDistance.value, [0, threshold], [0.5, 1], Extrapolation.CLAMP),
        },
      ],
    };
  }) as AnimatedStyle;

  const pullTranslateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: pullDistance.value }],
    };
  }) as AnimatedStyle;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const container = containerRef.current;
      if (container?.scrollTop === 0 && activeTab === 'feed' && e.touches?.[0]) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [activeTab]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const container = containerRef.current;
      if (!isPulling.current || !container || !e.touches?.[0] || !enabled) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && diff < 120) {
        pullDistance.value = diff;
      }
    },
    [pullDistance, enabled]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || !enabled) return;
    isPulling.current = false;

    const distance = pullDistance.value;

    if (distance > threshold) {
      setIsRefreshing(true);
      haptics.impact('light');

      try {
        await onRefresh();
        haptics.success();
        void toast.success('Feed refreshed!');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to refresh feed', err);
        haptics.error();
        void toast.error('Failed to refresh');
      } finally {
        setIsRefreshing(false);
      }
    }

    pullDistance.value = withSpring(0, springConfigs.smooth);
  }, [pullDistance, onRefresh, threshold, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container || activeTab !== 'feed') return;

    const touchStartHandler = (e: TouchEvent) => handleTouchStart(e);
    const touchMoveHandler = (e: TouchEvent) => handleTouchMove(e);
    const touchEndHandler = () => {
      void handleTouchEnd();
    };

    container.addEventListener('touchstart', touchStartHandler, { passive: true });
    container.addEventListener('touchmove', touchMoveHandler, { passive: true });
    container.addEventListener('touchend', touchEndHandler, { passive: true });

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, activeTab, enabled]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    pullOpacityStyle,
    pullRotationStyle,
    pullScaleStyle,
    pullTranslateStyle,
  };
}
