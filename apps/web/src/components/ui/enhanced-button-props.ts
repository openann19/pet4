'use client';

import { useMemo } from 'react';
import type { buttonVariants } from '@/components/ui/button';

export function useEnhancedButtonProps(
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
  disabled: boolean | undefined,
  loading: boolean
): {
  buttonVariant: keyof typeof buttonVariants;
  isDisabled: boolean;
} {
  const buttonVariant = useMemo(() => variant as keyof typeof buttonVariants, [variant]);
  const isDisabled = useMemo(() => Boolean(disabled) || loading, [disabled, loading]);

  return {
    buttonVariant,
    isDisabled,
  };
}

