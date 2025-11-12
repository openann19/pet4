import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground placeholder:transition-opacity focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:animate-pulse dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground shadow-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:shadow-md focus:placeholder:opacity-50 hover:border-ring/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30 read-only:bg-muted/20 read-only:cursor-default selection:bg-primary selection:text-primary-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
