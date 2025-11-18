'use client';

import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { withSpring } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { SharedValue } from '@petspark/motion';

const logger = createLogger('EnhancedButtonHandlers');

interface UseEnhancedButtonHandlersOptions {
  disabled?: boolean;
  loading: boolean;
  hapticFeedback: boolean;
  enableGlow: boolean;
  glowOpacity: SharedValue<number>;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant: string;
  size: string;
}

export function useEnhancedButtonHandlers({
  disabled,
  loading,
  hapticFeedback,
  enableGlow,
  glowOpacity,
  onClick,
  variant,
  size,
}: UseEnhancedButtonHandlersOptions) {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        return;
      }

      try {
        if (hapticFeedback) {
          haptics.impact('light');
        }

        if (enableGlow) {
          glowOpacity.value = withSpring(1, springConfigs.bouncy);
          setTimeout(() => {
            glowOpacity.value = withSpring(0.6, springConfigs.smooth);
          }, 200);
        }

        onClick?.(e);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('EnhancedButton onClick _error', err, { variant, size });
      }
    },
    [disabled, loading, hapticFeedback, enableGlow, glowOpacity, onClick, variant, size]
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || loading) {
      return;
    }

    if (enableGlow) {
      glowOpacity.value = withSpring(1, springConfigs.smooth);
    }
  }, [disabled, loading, enableGlow, glowOpacity]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || loading) {
      return;
    }

    if (enableGlow) {
      glowOpacity.value = withSpring(0.3, springConfigs.smooth);
    }
  }, [disabled, loading, enableGlow, glowOpacity]);

  return {
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
  };
}

