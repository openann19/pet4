/**
 * Target Size Hook (WCAG 2.2 AAA)
 *
 * Hook to ensure touch targets meet WCAG 2.2 AAA requirements.
 *
 * Location: apps/web/src/hooks/use-target-size.ts
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  validateTargetSize,
  ensureTargetSize,
  type TargetSizeConfig,
  DEFAULT_TARGET_SIZE_CONFIG,
  type TargetSizeValidationResult,
} from '@/core/a11y/target-size';
import { createLogger } from '@/lib/logger';

const _logger = createLogger('use-target-size');

/**
 * Options for target size hook
 */
export interface UseTargetSizeOptions {
  readonly enabled?: boolean;
  readonly autoFix?: boolean;
  readonly config?: TargetSizeConfig;
  readonly onInvalid?: (result: TargetSizeValidationResult) => void;
}

/**
 * Return type for target size hook
 */
export interface UseTargetSizeReturn {
  readonly validate: (element: HTMLElement) => TargetSizeValidationResult;
  readonly ensure: (element: HTMLElement) => void;
}

/**
 * Hook to ensure touch targets meet WCAG 2.2 AAA requirements
 */
export function useTargetSize(options: UseTargetSizeOptions = {}): UseTargetSizeReturn {
  const { enabled = true, autoFix = false, config = DEFAULT_TARGET_SIZE_CONFIG, onInvalid } = options;
  const elementRef = useRef<HTMLElement | null>(null);

  const validate = useCallback(
    (element: HTMLElement): TargetSizeValidationResult => {
      return validateTargetSize(element, config);
    },
    [config]
  );

  const ensure = useCallback(
    (element: HTMLElement): void => {
      if (!enabled) {
        return;
      }

      const result = validateTargetSize(element, config);

      if (!result.valid) {
        if (onInvalid) {
          onInvalid(result);
        }

        if (autoFix) {
          ensureTargetSize(element, config);
        }
      }
    },
    [enabled, autoFix, config, onInvalid]
  );

  // Auto-validate on mount if element ref is provided
  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    ensure(elementRef.current);
  }, [enabled, ensure]);

  return {
    validate,
    ensure,
  };
}

/**
 * Hook to validate target size for a ref
 */
export function useTargetSizeRef(options: UseTargetSizeOptions = {}) {
  const { validate: _validate, ensure } = useTargetSize(options);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ensure(ref.current);
    }
  }, [ensure]);

  return ref;
}
