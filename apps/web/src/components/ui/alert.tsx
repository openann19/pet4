import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaAlertAttributes } from '@/lib/accessibility';

const alertVariants = cva(
  cn(
    'relative w-full rounded-lg border grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] items-start [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current [&>svg]:shrink-0',
    getTypographyClasses('caption'),
    getSpacingClassesFromConfig({ paddingX: 'lg', paddingY: 'md', gap: 'md' })
  ),
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border',
        destructive:
          'text-destructive bg-destructive/10 border-destructive/20 [&>svg]:text-destructive *:data-[slot=alert-description]:text-destructive/90',
        warning:
          'text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400 *:data-[slot=alert-description]:text-amber-800 dark:*:data-[slot=alert-description]:text-amber-200',
        info: 'text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400 *:data-[slot=alert-description]:text-blue-800 dark:*:data-[slot=alert-description]:text-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  const alertRole = variant === 'destructive' ? 'alert' : 'status';
  const ariaAttrs = getAriaAlertAttributes({
    role: alertRole,
    live: variant === 'destructive' ? 'assertive' : 'polite',
    atomic: true,
  });

  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...ariaAttrs}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4',
        getTypographyClasses('subtitle'),
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start [&_p]:leading-relaxed',
        getTypographyClasses('caption'),
        getSpacingClassesFromConfig({ spaceY: 'xs' }),
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
