'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { ReactNode, MouseEvent, TouchEvent } from 'react';

export interface BubbleGestureWrapperProps {
  children: ReactNode;
  onPress?: (event: { x: number; y: number }) => void;
  onLongPress?: (event: { x: number; y: number }) => void;
  onPanStart?: (event: { x: number; y: number }) => void;
  onPanUpdate?: (event: {
    translationX: number;
    translationY: number;
    x: number;
    y: number;
  }) => void;
  onPanEnd?: (event: {
    translationX: number;
    translationY: number;
    velocityX: number;
    velocityY: number;
  }) => void;
  onHover?: (event: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
  enabled?: boolean;
}

const LONG_PRESS_DURATION = 500;

export function BubbleGestureWrapper({
  children,
  onPress,
  onLongPress,
  onPanStart,
  onPanUpdate,
  onPanEnd,
  onHover,
  onHoverEnd,
  enabled = true,
}: BubbleGestureWrapperProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isPressedRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled) {
        return;
      }

      isPressedRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      touchStartTimeRef.current = Date.now();

      if (onPanStart) {
        onPanStart({ x: e.clientX, y: e.clientY });
      }

      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (isPressedRef.current) {
            onLongPress({ x: e.clientX, y: e.clientY });
          }
        }, LONG_PRESS_DURATION);
      }
    },
    [enabled, onPanStart, onLongPress]
  );

  const handleMouseMove = useCallback(
    (_e: MouseEvent) => {
      if (!enabled || !isPressedRef.current || !panStartRef.current) {
        return;
      }

      const translationX = _e.clientX - panStartRef.current.x;
      const translationY = _e.clientY - panStartRef.current.y;

      if (onPanUpdate) {
        onPanUpdate({
          translationX,
          translationY,
          x: _e.clientX,
          y: _e.clientY,
        });
      }
    },
    [enabled, onPanUpdate]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!enabled) {
        return;
      }

      const wasPressed = isPressedRef.current;
      isPressedRef.current = false;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = undefined as unknown as ReturnType<typeof setTimeout>;
      }

      if (wasPressed && panStartRef.current) {
        const duration = Date.now() - touchStartTimeRef.current;
        const translationX = e.clientX - panStartRef.current.x;
        const translationY = e.clientY - panStartRef.current.y;

        const velocityX = duration > 0 ? translationX / duration : 0;
        const velocityY = duration > 0 ? translationY / duration : 0;

        if (
          duration < LONG_PRESS_DURATION &&
          Math.abs(translationX) < 10 &&
          Math.abs(translationY) < 10
        ) {
          if (onPress) {
            onPress({ x: e.clientX, y: e.clientY });
          }
        } else if (onPanEnd) {
          onPanEnd({
            translationX,
            translationY,
            velocityX: velocityX * 1000,
            velocityY: velocityY * 1000,
          });
        }
      }

      panStartRef.current = null;
    },
    [enabled, onPress, onPanEnd]
  );

  const handleMouseLeave = useCallback(() => {
    isPressedRef.current = false;
    panStartRef.current = null;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined as unknown as ReturnType<typeof setTimeout>;
    }

    if (onHoverEnd) {
      onHoverEnd();
    }
  }, [onHoverEnd]);

  const handleMouseEnter = useCallback(
    (e: MouseEvent) => {
      if (!enabled) {
        return;
      }

      if (onHover) {
        onHover({ x: e.clientX, y: e.clientY });
      }
    },
    [enabled, onHover]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length !== 1) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      isPressedRef.current = true;
      panStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartTimeRef.current = Date.now();

      if (onPanStart) {
        onPanStart({ x: touch.clientX, y: touch.clientY });
      }

      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (isPressedRef.current && panStartRef.current) {
            onLongPress({ x: panStartRef.current.x, y: panStartRef.current.y });
          }
        }, LONG_PRESS_DURATION);
      }
    },
    [enabled, onPanStart, onLongPress]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !isPressedRef.current || !panStartRef.current || e.touches.length !== 1) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      const translationX = touch.clientX - panStartRef.current.x;
      const translationY = touch.clientY - panStartRef.current.y;

      if (onPanUpdate) {
        onPanUpdate({
          translationX,
          translationY,
          x: touch.clientX,
          y: touch.clientY,
        });
      }
    },
    [enabled, onPanUpdate]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) {
        return;
      }

      const wasPressed = isPressedRef.current;
      isPressedRef.current = false;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = undefined as unknown as ReturnType<typeof setTimeout>;
      }

      if (wasPressed && panStartRef.current) {
        const touch = e.changedTouches[0];
        if (!touch) {
          panStartRef.current = null;
          return;
        }

        const duration = Date.now() - touchStartTimeRef.current;
        const translationX = touch.clientX - panStartRef.current.x;
        const translationY = touch.clientY - panStartRef.current.y;

        const velocityX = duration > 0 ? translationX / duration : 0;
        const velocityY = duration > 0 ? translationY / duration : 0;

        if (
          duration < LONG_PRESS_DURATION &&
          Math.abs(translationX) < 10 &&
          Math.abs(translationY) < 10
        ) {
          if (onPress) {
            onPress({ x: touch.clientX, y: touch.clientY });
          }
        } else if (onPanEnd) {
          onPanEnd({
            translationX,
            translationY,
            velocityX: velocityX * 1000,
            velocityY: velocityY * 1000,
          });
        }
      }

      panStartRef.current = null;
    },
    [enabled, onPress, onPanEnd]
  );

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}
