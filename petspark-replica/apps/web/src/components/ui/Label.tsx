import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    {
        variants: {
            variant: {
                default: 'text-foreground',
                secondary: 'text-muted-foreground',
                destructive: 'text-destructive',
            },
            size: {
                default: 'text-sm',
                sm: 'text-xs',
                lg: 'text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
    htmlFor?: string;
}

const Label = memo(forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, variant, size, htmlFor, ...props }, ref) => {
        return (
            <label
                ref={ref}
                htmlFor={htmlFor}
                className={cn(labelVariants({ variant, size, className }))}
                {...props}
            />
        );
    }
));

Label.displayName = 'MemoizedLabel';

export { Label, labelVariants };
