import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';

function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card text-card-foreground transition-colors duration-300 shadow-sm',
        getSpacingClassesFromConfig({ gap: 'xl' }),
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        'bg-card',
        getSpacingClassesFromConfig({ gap: 'sm', paddingX: '2xl', paddingY: 'xl' }),
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        getTypographyClasses('h3'),
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        'text-muted-foreground',
        getTypographyClasses('bodyMuted'),
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'lg' }),
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center bg-card/80 [.border-t]:pt-6',
        getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'lg' }),
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
