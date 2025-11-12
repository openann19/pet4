import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { FocusRing } from '@/core/tokens';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-13 w-full min-w-0 rounded-[var(--radius-md)] border border-(--border-light) bg-white px-4 text-(--text-md) text-(--text-primary) transition-colors duration-200 outline-none',
        'placeholder:text-(--text-tertiary)',
        'selection:bg-primary selection:text-primary-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        `focus:border-(--coral-primary) ${FocusRing.input}`,
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-(--muted) disabled:text-(--disabled)',
        'aria-invalid:border-(--error) aria-invalid:ring-2 aria-invalid:ring-[var(--error)]/20',
        'read-only:bg-muted/20 read-only:cursor-default',
        className
      )}
      {...props}
    />
  );
}

export { Input };
