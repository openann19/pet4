import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
    'animate-pulse rounded-md bg-muted',
    {
        variants: {
            variant: {
                default: 'bg-muted',
                card: 'bg-card',
                input: 'bg-input',
                secondary: 'bg-secondary',
            },
            shape: {
                default: 'rounded-md',
                rounded: 'rounded-full',
                square: 'rounded-none',
            },
        },
        defaultVariants: {
            variant: 'default',
            shape: 'default',
        },
    }
);

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
    asChild?: boolean;
}

const Skeleton = memo(forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant, shape, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(skeletonVariants({ variant, shape }), className)}
                {...props}
            />
        );
    }
));

Skeleton.displayName = 'MemoizedSkeleton';

export { Skeleton, skeletonVariants };
