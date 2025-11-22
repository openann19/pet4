/**
 * Focus Manager Hook
 *
 * Manages focus traps, focus restoration, and focus navigation.
 * Essential for accessibility and keyboard navigation.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';

export interface UseFocusManagerOptions {
  trap?: boolean;
  restoreFocus?: boolean;
  initialFocus?: RefObject<HTMLElement>;
  returnFocus?: RefObject<HTMLElement>;
  enabled?: boolean;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }
  );
}

/**
 * Focus manager hook
 *
 * @example
 * ```typescript
 * const { trapFocus, restoreFocus } = useFocusManager({
 *   trap: true,
 *   restoreFocus: true,
 *   containerRef: modalRef,
 * });
 * ```
 */
export function useFocusManager(
  containerRef: RefObject<HTMLElement>,
  options: UseFocusManagerOptions = {}
): {
  trapFocus: () => void;
  restoreFocus: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
} {
  const { trap = false, restoreFocus: shouldRestoreFocus = false, enabled = true } = options;

  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const trapEnabledRef = useRef(false);

  // Save previous focus
  useEffect(() => {
    if (shouldRestoreFocus && enabled) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }
  }, [shouldRestoreFocus, enabled]);

  // Focus first element
  const focusFirst = useCallback((): void => {
    if (!containerRef.current || !enabled) {
      return;
    }

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }
  }, [containerRef, enabled]);

  // Focus last element
  const focusLast = useCallback((): void => {
    if (!containerRef.current || !enabled) {
      return;
    }

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      const lastElement = focusableElements[focusableElements.length - 1];
      if (lastElement) {
        lastElement.focus();
      }
    }
  }, [containerRef, enabled]);

  // Focus next element
  const focusNext = useCallback((): void => {
    if (!containerRef.current || !enabled) {
      return;
    }

    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1]?.focus();
    } else if (trap && focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }
  }, [containerRef, enabled, trap]);

  // Focus previous element
  const focusPrevious = useCallback((): void => {
    if (!containerRef.current || !enabled) {
      return;
    }

    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1]?.focus();
    } else if (trap && focusableElements.length > 0) {
      const lastElement = focusableElements[focusableElements.length - 1];
      if (lastElement) {
        lastElement.focus();
      }
    }
  }, [containerRef, enabled, trap]);

  // Trap focus within container
  const trapFocus = useCallback((): void => {
    if (!containerRef.current || !enabled || !trap) {
      return;
    }

    trapEnabledRef.current = true;
    focusFirst();
  }, [containerRef, enabled, trap, focusFirst]);

  // Restore focus to previous element
  const restoreFocus = useCallback((): void => {
    if (!shouldRestoreFocus || !enabled) {
      return;
    }

    trapEnabledRef.current = false;

    if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [shouldRestoreFocus, enabled]);

  // Handle Tab key for focus trapping
  useEffect(() => {
    if (!trap || !enabled || !containerRef.current) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || !trapEnabledRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(containerRef.current!);
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift+Tab: move to previous
        if (currentElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: move to next
        if (currentElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [trap, enabled, containerRef]);

  return {
    trapFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
}
