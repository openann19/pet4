import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

interface SkeletonProps extends ComponentProps<'div'> {
  variant?: 'default' | 'shimmer';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      data-slot="skeleton"
      className={cn(
        'bg-muted rounded-md',
        variant === 'default' && 'animate-pulse',
        variant === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Skeleton };
