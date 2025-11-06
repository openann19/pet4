/**
 * useLongPress - React hook for long press gestures
 * Supports touch and mouse events with configurable delay
 */

import { useRef, useEffect, useCallback } from 'react';
import type { RefObject } from 'react';

interface LongPressHandlers {
  onLongPress?: () => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  onLongPressCancel?: () => void;
}

interface LongPressOptions {
  delay?: number; // Long press duration in ms
  moveThreshold?: number; // Max movement allowed (px)
  enabled?: boolean;
}

export function useLongPress<T extends HTMLElement = HTMLDivElement>(
  handlers: LongPressHandlers = {},
  options: LongPressOptions = {}
): RefObject<T | null> {
  const {
    delay = 500,
    moveThreshold = 10,
    enabled = true,
  } = options;

  const ref = useRef<T | null>(null);
  const timerRef = useRef<number>();
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isLongPressing = useRef<boolean>(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    
    if (isLongPressing.current) {
      handlers.onLongPressEnd?.();
      isLongPressing.current = false;
    } else if (timerRef.current !== undefined) {
      handlers.onLongPressCancel?.();
    }
  }, [handlers]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const handleStart = (clientX: number, clientY: number) => {
      startX.current = clientX;
      startY.current = clientY;
      isLongPressing.current = false;

      handlers.onLongPressStart?.();

      timerRef.current = window.setTimeout(() => {
        isLongPressing.current = true;
        handlers.onLongPress?.();
      }, delay);
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!timerRef.current) return;

      const deltaX = Math.abs(clientX - startX.current);
      const deltaY = Math.abs(clientY - startY.current);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        cancel();
      }
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      cancel();
    };

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      cancel();
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);

    return () => {
      cancel();
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handlers, delay, moveThreshold, enabled, cancel]);

  return ref;
}
