import React from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { getAriaLiveRegionAttributes } from '@/lib/accessibility';

interface SkeletonProps extends ComponentProps<'div'> {
  variant?: 'default' | 'shimmer';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const liveRegionAttrs = getAriaLiveRegionAttributes({
    live: 'polite',
    atomic: true,
  });

  return (
    <div
      role="status"
      aria-label="Loading content"
      data-slot="skeleton"
      className={cn(
        'bg-muted rounded-md',
        variant === 'default' && 'animate-pulse',
        variant === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...liveRegionAttrs}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Skeleton };
