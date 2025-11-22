import { useEffect } from 'react';
import type { RefObject } from 'react';
import { isTruthy } from '@petspark/shared';

/**
 * Hook for trapping focus within a container (useful for modals and dialogs)
 * Improves accessibility by keeping keyboard navigation within modal bounds
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, enabled = true): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('disabled')
      );
    };

    const handleTabKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (firstElement === undefined || lastElement === undefined) {
        return;
      }

      if (isTruthy(event.shiftKey)) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element when trap is enabled
    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    if (firstElement !== undefined) {
      firstElement.focus();
    }

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, enabled]);
}
