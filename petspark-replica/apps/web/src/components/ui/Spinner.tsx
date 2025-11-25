import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
    'animate-spin',
    {
        variants: {
            size: {
                xs: 'h-3 w-3',
                sm: 'h-4 w-4',
                default: 'h-6 w-6',
                lg: 'h-8 w-8',
                xl: 'h-12 w-12',
            },
            variant: {
                default: 'text-muted-foreground',
                primary: 'text-primary',
                secondary: 'text-secondary',
                destructive: 'text-destructive',
                success: 'text-green-600 dark:text-green-400',
                warning: 'text-yellow-600 dark:text-yellow-400',
                info: 'text-blue-600 dark:text-blue-400',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
);

export interface SpinnerProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
    asChild?: boolean;
}

const Spinner = memo(forwardRef<HTMLDivElement, SpinnerProps>(
    ({ className, size, variant, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(spinnerVariants({ size, variant }), className)}
                role="status"
                aria-label="Loading..."
                {...props}
            >
                <svg
                    className="h-full w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }
));

Spinner.displayName = 'MemoizedSpinner';

export { Spinner, spinnerVariants };
