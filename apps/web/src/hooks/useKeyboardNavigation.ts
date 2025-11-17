import { useEffect } from 'react';
import type { RefObject } from 'react';
import { isTruthy, isDefined } from '@petspark/shared';

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 * Improves accessibility by adding keyboard shortcuts
 */
export function useKeyboardNavigation(
  ref: RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions
): void {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onSpace,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'Enter':
          if (isTruthy(onEnter)) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Escape':
          if (isTruthy(onEscape)) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (isTruthy(onArrowUp)) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (isTruthy(onArrowDown)) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (isTruthy(onArrowLeft)) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (isTruthy(onArrowRight)) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case ' ':
          if (isTruthy(onSpace)) {
            event.preventDefault();
            onSpace();
          }
          break;
      }
    };

    const element = ref.current;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onSpace, enabled]);
}
