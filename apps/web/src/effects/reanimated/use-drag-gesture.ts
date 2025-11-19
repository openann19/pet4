'use client';

import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
  type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';


export interface UseDragGestureOptions {
  enabled?: boolean;
  axis?: 'x' | 'y' | 'both';
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  onDragStart?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  hapticFeedback?: boolean;
  snapBack?: boolean;
  snapBackDuration?: number;
}

export interface UseDragGestureReturn {
  x: SharedValue<number>;
  y: SharedValue<number>;
  isDragging: React.MutableRefObject<boolean>;
  animatedStyle: AnimatedStyle;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  reset: () => void;
}

export function useDragGesture(options: UseDragGestureOptions = {}): UseDragGestureReturn {
  const {
    enabled = true,
    axis = 'both',
    bounds,
    onDragStart,
    onDrag,
    onDragEnd,
    hapticFeedback = true,
    snapBack = false,
    snapBackDuration = timingConfigs.smooth.duration ?? 300,
  } = options;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const isDragging = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const isActiveRef = useRef(false);

  const constrainValue = useCallback((value: number, min?: number, max?: number): number => {
    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    return value;
  }, []);

  const getConstrainedX = useCallback(
    (newX: number): number => {
      if (bounds?.left !== undefined || bounds?.right !== undefined) {
        return constrainValue(newX, bounds.left, bounds.right);
      }
      return newX;
    },
    [bounds, constrainValue]
  );

  const getConstrainedY = useCallback(
    (newY: number): number => {
      if (bounds?.top !== undefined || bounds?.bottom !== undefined) {
        return constrainValue(newY, bounds.top, bounds.bottom);
      }
      return newY;
    },
    [bounds, constrainValue]
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return;

      isActiveRef.current = true;
      startXRef.current = clientX;
      startYRef.current = clientY;
      offsetXRef.current = x.value;
      offsetYRef.current = y.value;
      isDragging.current = true;

      if (hapticFeedback) {
        haptics.selection();
      }

      onDragStart?.();
    },
    [enabled, hapticFeedback, x, y, isDragging, onDragStart]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !isActiveRef.current) return;

      const deltaX = clientX - startXRef.current;
      const deltaY = clientY - startYRef.current;

      let newX = offsetXRef.current;
      let newY = offsetYRef.current;

      if (axis === 'x' || axis === 'both') {
        newX = getConstrainedX(offsetXRef.current + deltaX);
        x.value = newX;
      }

      if (axis === 'y' || axis === 'both') {
        newY = getConstrainedY(offsetYRef.current + deltaY);
        y.value = newY;
      }

      onDrag?.(newX, newY);
    },
    [enabled, axis, x, y, getConstrainedX, getConstrainedY, onDrag]
  );

  const handleEnd = useCallback(() => {
    if (!enabled || !isActiveRef.current) return;

    isActiveRef.current = false;
    isDragging.current = false;

    const finalX = x.value;
    const finalY = y.value;

    if (snapBack) {
      x.value = withTiming(0, { duration: snapBackDuration });
      y.value = withTiming(0, { duration: snapBackDuration });
    }

    onDragEnd?.(finalX, finalY);
  }, [enabled, snapBack, snapBackDuration, x, y, isDragging, onDragEnd]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleStart(touch.clientX, touch.clientY);
      }
    },
    [handleStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isActiveRef.current) return;
      const touch = e.touches[0];
      if (touch) {
        e.preventDefault();
        handleMove(touch.clientX, touch.clientY);
      }
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const reset = useCallback(() => {
    x.value = withSpring(0, springConfigs.smooth);
    y.value = withSpring(0, springConfigs.smooth);
    isDragging.current = false;
    isActiveRef.current = false;
    offsetXRef.current = 0;
    offsetYRef.current = 0;
  }, [x, y]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];

    if (x.value !== 0) {
      transforms.push({ translateX: x.value });
    }
    if (y.value !== 0) {
      transforms.push({ translateY: y.value });
    }

    return {
      transform: transforms.length > 0 ? transforms : undefined,
      cursor: isDragging.current ? 'grabbing' : 'grab',
    };
  }) as AnimatedStyle;

  return {
    x,
    y,
    isDragging,
    animatedStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset,
  };
}
