'use client';

import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';

export type HapticAction =
  | 'tap'
  | 'swipe'
  | 'delete'
  | 'react'
  | 'send'
  | 'longPress'
  | 'error'
  | 'success';

export interface UseHapticFeedbackOptions {
  enabled?: boolean;
}

export interface UseHapticFeedbackReturn {
  trigger: (action: HapticAction) => void;
}

const DEFAULT_ENABLED = true;

const HAPTIC_MAP: Record<HapticAction, () => void> = {
  tap: () => haptics.light(),
  swipe: () => haptics.selection(),
  delete: () => haptics.medium(),
  react: () => haptics.light(),
  send: () => haptics.success(),
  longPress: () => haptics.medium(),
  error: () => haptics.error(),
  success: () => haptics.success(),
};

export function useHapticFeedback(options: UseHapticFeedbackOptions = {}): UseHapticFeedbackReturn {
  const { enabled = DEFAULT_ENABLED } = options;

  const trigger = useCallback(
    (action: HapticAction) => {
      if (!enabled) {
        return;
      }

      const hapticFn = HAPTIC_MAP[action];
      if (hapticFn) {
        hapticFn();
      }
    },
    [enabled]
  );

  return {
    trigger,
  };
}
