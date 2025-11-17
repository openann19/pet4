'use client';

import { useMemo } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

export function useEnhancedButtonProps(
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
  disabled: boolean | undefined,
  loading: boolean
): {
  buttonVariant: VariantProps<typeof buttonVariants>['variant'];
  isDisabled: boolean;
} {
  const buttonVariant = useMemo(() => variant as VariantProps<typeof buttonVariants>['variant'], [variant]);
  const isDisabled = useMemo(() => Boolean(disabled) || loading, [disabled, loading]);

  return {
    buttonVariant,
    isDisabled,
  };
}

