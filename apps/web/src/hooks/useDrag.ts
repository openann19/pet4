/**
 * useDrag - React hook for drag gestures
 * Supports both touch and mouse drag events with bounds
 */

import { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { isTruthy } from '@petspark/shared';

interface DragPosition {
  x: number;
  y: number;
}

interface DragHandlers {
  onDragStart?: (position: DragPosition) => void;
  onDrag?: (position: DragPosition, delta: DragPosition) => void;
  onDragEnd?: (position: DragPosition) => void;
}

interface DragOptions {
  enabled?: boolean;
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  axis?: 'x' | 'y' | 'both';
}

export function useDrag<T extends HTMLElement = HTMLDivElement>(
  handlers: DragHandlers = {},
  options: DragOptions = {}
): RefObject<T | null> {
  const { enabled = true, bounds, axis = 'both' } = options;

  const ref = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef<DragPosition>({ x: 0, y: 0 });
  const currentPos = useRef<DragPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const clampPosition = (pos: DragPosition): DragPosition => {
      let { x, y } = pos;

      if (isTruthy(bounds)) {
        if (bounds.left !== undefined) x = Math.max(x, bounds.left);
        if (bounds.right !== undefined) x = Math.min(x, bounds.right);
        if (bounds.top !== undefined) y = Math.max(y, bounds.top);
        if (bounds.bottom !== undefined) y = Math.min(y, bounds.bottom);
      }

      return { x, y };
    };

    const handleStart = (clientX: number, clientY: number) => {
      setIsDragging(true);
      startPos.current = { x: clientX, y: clientY };
      currentPos.current = { x: clientX, y: clientY };

      const position = clampPosition({ x: clientX, y: clientY });
      handlers.onDragStart?.(position);
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;

      let x = clientX;
      let y = clientY;

      // Apply axis constraints
      if (axis === 'x') {
        y = currentPos.current.y;
      } else if (axis === 'y') {
        x = currentPos.current.x;
      }

      const position = clampPosition({ x, y });
      const delta = {
        x: position.x - currentPos.current.x,
        y: position.y - currentPos.current.y,
      };

      currentPos.current = position;
      handlers.onDrag?.(position, delta);
    };

    const handleEnd = () => {
      if (!isDragging) return;

      setIsDragging(false);
      handlers.onDragEnd?.(currentPos.current);
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
      handleEnd();
    };

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handlers, enabled, bounds, axis, isDragging]);

  return ref;
}
