import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';

const badgeVariants = cva(
  cn(
    'inline-flex items-center justify-center rounded-full border w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors overflow-hidden uppercase tracking-wide',
    getTypographyClasses('caption'),
    getSpacingClassesFromConfig({ paddingX: 'sm', paddingY: 'xs', gap: 'xs' })
  ),
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40',
        outline: 'text-foreground border-border hover:bg-muted/50',
        success: 'border-transparent bg-success text-success-foreground hover:bg-success/90',
        warning: 'border-transparent bg-warning text-warning-foreground hover:bg-warning/90',
        muted: 'border-transparent bg-muted text-muted-foreground',
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
