import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-(--coral-primary) focus-visible:ring-[var(--coral-primary)]/50 focus-visible:ring-[3px] aria-invalid:ring-[var(--error)]/20 dark:aria-invalid:ring-[var(--error)]/40 aria-invalid:border-(--error) transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-(--coral-primary) text-white [a&]:hover:bg-(--coral-hover)',
        secondary:
          'border-transparent bg-(--secondary-accent-orange) text-(--text-primary) [a&]:hover:bg-(--secondary-accent-yellow)',
        destructive:
          'border-transparent bg-(--error) text-white [a&]:hover:bg-(--coral-hover) focus-visible:ring-[var(--error)]/20 dark:focus-visible:ring-[var(--error)]/40',
        outline: 'text-(--text-primary) border-(--border-light) [a&]:hover:bg-(--secondary-accent-orange) [a&]:hover:text-(--text-primary)',
        success: 'border-transparent bg-(--success) text-white [a&]:hover:bg-(--success)/90',
        warning: 'border-transparent bg-(--warning) text-(--text-primary) [a&]:hover:bg-(--warning)/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
