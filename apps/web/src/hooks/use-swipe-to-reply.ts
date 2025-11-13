'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from '@petspark/motion';
import { useCallback, useRef } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseSwipeToReplyOptions {
  onReply?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
}

export interface UseSwipeToReplyReturn {
  translateX: SharedValue<number>;
  opacity: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  handleTouchStart: (event: React.TouchEvent | React.MouseEvent) => void;
  handleTouchMove: (event: React.TouchEvent | React.MouseEvent) => void;
  handleTouchEnd: () => void;
}

const DEFAULT_THRESHOLD = 100;

export function useSwipeToReply(options: UseSwipeToReplyOptions = {}): UseSwipeToReplyReturn {
  const { onReply, threshold = DEFAULT_THRESHOLD, hapticFeedback = true } = options;

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const startX = useSharedValue(0);
  const isDragging = useRef(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const handleTouchStart = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      startX.value = clientX;
      isDragging.current = true;
    },
    [startX]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging.current) return;

      const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      const deltaX = clientX - startX.value;

      if (deltaX < 0) {
        translateX.value = deltaX;
      }
    },
    [startX, translateX]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;

    if (Math.abs(translateX.value) >= threshold && onReply) {
      if (hapticFeedback) {
        haptics.success();
      }
      onReply();
      translateX.value = withSpring(0, springConfigs.smooth);
    } else {
      translateX.value = withSpring(0, springConfigs.smooth);
    }
  }, [translateX, threshold, onReply, hapticFeedback]);

  return {
    translateX,
    opacity,
    animatedStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
