/**
 * useGestureSwipe - React hook for swipe gestures (alternative implementation)
 * Supports swipe up, down, left, right with configurable threshold
 */

import { useRef, useEffect, RefObject } from 'react';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface SwipeHandlers {
  onSwipe?: (direction: SwipeDirection) => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: (x: number, y: number) => void;
  onSwipeMove?: (deltaX: number, deltaY: number) => void;
  onSwipeEnd?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe (px)
  velocityThreshold?: number; // Minimum velocity (px/ms)
  enabled?: boolean;
}

export function useGestureSwipe<T extends HTMLElement = HTMLDivElement>(
  handlers: SwipeHandlers = {},
  options: SwipeOptions = {}
): RefObject<T> {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
      isSwiping.current = true;

      handlers.onSwipeStart?.(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      handlers.onSwipeMove?.(deltaX, deltaY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const endX = touch.clientX;
      const endY = touch.clientY;
      const deltaX = endX - startX.current;
      const deltaY = endY - startY.current;
      const timeElapsed = Date.now() - startTime.current;

      isSwiping.current = false;
      handlers.onSwipeEnd?.();

      // Calculate velocity
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const velocity = distance / timeElapsed;

      // Check if threshold is met
      if (distance < threshold || velocity < velocityThreshold) {
        return;
      }

      // Determine direction
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      let direction: SwipeDirection;

      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Call handlers
      handlers.onSwipe?.(direction);
      
      switch (direction) {
        case 'up':
          handlers.onSwipeUp?.();
          break;
        case 'down':
          handlers.onSwipeDown?.();
          break;
        case 'left':
          handlers.onSwipeLeft?.();
          break;
        case 'right':
          handlers.onSwipeRight?.();
          break;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, velocityThreshold, enabled]);

  return ref;
}
