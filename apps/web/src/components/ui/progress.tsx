import type { ComponentProps } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

function Progress({ className, value, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  const progressValue = value ?? 0;
  const ariaValueNow = Math.round(progressValue);
  
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ariaValueNow}
      aria-label={props['aria-label'] ?? `Progress: ${ariaValueNow}%`}
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full shadow-inner',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 rounded-full shadow-sm transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${String(100 - progressValue)}%)` }}
        aria-hidden="true"
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
