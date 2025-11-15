import { useMemo } from 'react';
import { haptics } from '@/lib/haptics';
import { Motion } from '@/core/tokens/motion';

interface InteractionFeedback {
  readonly press: () => void;
  readonly select: () => void;
  readonly impact: () => void;
  readonly motionProps: {
    whileHover: { scale: number };
    whileTap: { scale: number };
    transition: { duration: number };
  };
}

/**
 * Unified micro‑interaction helper for consistent haptic + motion behavior.
 * Web uses scale micro animations; durations sourced from motion tokens.
 */
export function useInteractionFeedback(): InteractionFeedback {
  return useMemo(() => {
    const press = () => {
      void haptics.selection();
    };
    const select = () => {
      void haptics.selection();
    };
    const impact = () => {
      void haptics.impact();
    };
    return {
      press,
      select,
      impact,
      motionProps: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { duration: Motion.components.button.press.duration / 1000 },
      },
    };
  }, []);
}
