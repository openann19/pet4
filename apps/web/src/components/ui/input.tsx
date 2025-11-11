import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-[50px] w-full min-w-0 rounded-[12px] border border-[#E5E7EB] bg-white px-4 text-[15px] text-[#1F2937] transition-colors duration-200 outline-none',
        'placeholder:text-[#9CA3AF]',
        'selection:bg-primary selection:text-primary-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'focus:border-[#D1D5DB] focus:outline-none',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        'read-only:bg-muted/20 read-only:cursor-default',
        className
      )}
      {...props}
    />
  );
}

export { Input };
