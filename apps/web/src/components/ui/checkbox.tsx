'use client';

import type { ComponentProps } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getAriaFormFieldAttributes } from '@/lib/accessibility';

function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-[18px] shrink-0 rounded-[4px] border border-(--border-light) bg-white transition-colors duration-200 outline-none',
        'data-[state=checked]:bg-(--coral-primary) data-[state=checked]:border-(--coral-primary) data-[state=checked]:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-primary)] focus-visible:ring-offset-2',
        'aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...getAriaFormFieldAttributes({
        invalid: props['aria-invalid'] === 'true' ? true : undefined,
        disabled: props.disabled,
      })}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-all duration-200 data-[state=checked]:scale-100 data-[state=unchecked]:scale-0"
        aria-hidden="true"
      >
        <Check className="size-3.5" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
