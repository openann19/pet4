/**
 * usePinchZoom - React hook for pinch-to-zoom gestures
 * Supports multi-touch pinch gestures for zooming
 */

import { useRef, useEffect } from 'react';
import type { RefObject } from 'react';

interface PinchZoomHandlers {
  onPinch?: (scale: number) => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
}

interface PinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  enabled?: boolean;
}

export function usePinchZoom<T extends HTMLElement = HTMLDivElement>(
  handlers: PinchZoomHandlers = {},
  options: PinchZoomOptions = {}
): RefObject<T | null> {
  const { minScale = 0.5, maxScale = 3, enabled = true } = options;

  const ref = useRef<T | null>(null);
  const initialDistance = useRef<number>(0);
  const currentScale = useRef<number>(1);
  const isPinching = useRef<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx ** 2 + dy ** 2);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;

      isPinching.current = true;
      initialDistance.current = getDistance(e.touches[0]!, e.touches[1]!);
      handlers.onPinchStart?.();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPinching.current || e.touches.length !== 2) return;

      const currentDistance = getDistance(e.touches[0]!, e.touches[1]!);
      let scale = currentDistance / initialDistance.current;

      // Clamp scale
      scale = Math.min(Math.max(scale, minScale), maxScale);
      currentScale.current = scale;

      handlers.onPinch?.(scale);
    };

    const handleTouchEnd = () => {
      if (!isPinching.current) return;

      isPinching.current = false;
      initialDistance.current = 0;
      handlers.onPinchEnd?.();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, minScale, maxScale, enabled]);

  return ref;
}
