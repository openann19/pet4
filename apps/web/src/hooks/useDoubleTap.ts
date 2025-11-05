/**
 * useDoubleTap - React hook for double tap gestures
 * Supports both touch and mouse double-click events
 */

import { useRef, useEffect, RefObject } from 'react';

interface DoubleTapHandlers {
  onDoubleTap?: () => void;
  onSingleTap?: () => void;
}

interface DoubleTapOptions {
  delay?: number; // Max time between taps (ms)
  enabled?: boolean;
}

export function useDoubleTap<T extends HTMLElement = HTMLDivElement>(
  handlers: DoubleTapHandlers = {},
  options: DoubleTapOptions = {}
): RefObject<T> {
  const {
    delay = 300,
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const lastTapTime = useRef<number>(0);
  const singleTapTimer = useRef<number>();

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const handleTap = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      // Clear pending single tap
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = undefined;
      }

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        // Double tap detected
        handlers.onDoubleTap?.();
        lastTapTime.current = 0;
      } else {
        // Potential single tap
        lastTapTime.current = now;
        
        // Wait to see if another tap comes
        singleTapTimer.current = window.setTimeout(() => {
          handlers.onSingleTap?.();
          singleTapTimer.current = undefined;
        }, delay);
      }
    };

    // Touch event
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleTap();
    };

    // Mouse event
    const handleClick = () => {
      handleTap();
    };

    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('click', handleClick);

    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('click', handleClick);
    };
  }, [handlers, delay, enabled]);

  return ref;
}
