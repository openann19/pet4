/**
 * Focus Not Obscured Hook (WCAG 2.2 AAA)
 *
 * Hook to ensure focused elements are not obscured by sticky headers/footers
 * or other UI elements.
 *
 * Location: apps/web/src/hooks/use-focus-not-obscured.ts
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  ensureFocusNotObscured,
  checkFocusNotObscured,
  type FocusVisibilityResult,
} from '@/core/a11y/focus-not-obscured';
import { createLogger } from '@/lib/logger';

const _logger = createLogger('use-focus-not-obscured');

/**
 * Options for focus not obscured hook
 */
export interface UseFocusNotObscuredOptions {
  readonly enabled?: boolean;
  readonly autoScroll?: boolean;
  readonly onObscured?: (result: FocusVisibilityResult) => void;
}

/**
 * Return type for focus not obscured hook
 */
export interface UseFocusNotObscuredReturn {
  readonly check: (element: HTMLElement) => FocusVisibilityResult;
  readonly ensure: (element: HTMLElement) => void;
}

/**
 * Hook to ensure focused elements are not obscured
 */
export function useFocusNotObscured(
  options: UseFocusNotObscuredOptions = {}
): UseFocusNotObscuredReturn {
  const { enabled = true, autoScroll = true, onObscured } = options;
  const cleanupRef = useRef<(() => void) | null>(null);

  const check = useCallback((element: HTMLElement): FocusVisibilityResult => {
    return checkFocusNotObscured(element);
  }, []);

  const ensure = useCallback(
    (element: HTMLElement): void => {
      if (!enabled) {
        return;
      }

      const result = checkFocusNotObscured(element);

      if (result.obscured) {
        if (onObscured) {
          onObscured(result);
        }

        if (autoScroll) {
          ensureFocusNotObscured(element);
        }
      }
    },
    [enabled, autoScroll, onObscured]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleFocus = (e: FocusEvent): void => {
      const target = e.target;
      if (target instanceof HTMLElement) {
        ensure(target);
      }
    };

    document.addEventListener('focusin', handleFocus);

    cleanupRef.current = () => {
      document.removeEventListener('focusin', handleFocus);
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [enabled, ensure]);

  return {
    check,
    ensure,
  };
}
