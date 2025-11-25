import { forwardRef, memo, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: '',
                destructive: 'border-destructive focus-visible:ring-destructive',
            },
            resize: {
                none: 'resize-none',
                vertical: 'resize-y',
                horizontal: 'resize-x',
                both: 'resize',
            },
        },
        defaultVariants: {
            variant: 'default',
            resize: 'vertical',
        },
    }
);

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
    label?: string;
    error?: string;
    description?: string;
}

const Textarea = memo(forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant, resize, label, error, description, id, ...props }, ref) => {
        const generatedId = useId();
        const textareaId = id || generatedId;

        return (
            <div className="space-y-2">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    id={textareaId}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `${textareaId}-error` : description ? `${textareaId}-description` : undefined}
                    className={cn(textareaVariants({ variant, resize, className }))}
                    ref={ref}
                    {...props}
                />
                {description && !error && (
                    <p id={`${textareaId}-description`} className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
                {error && (
                    <p id={`${textareaId}-error`} className="text-sm text-destructive" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
));

Textarea.displayName = 'MemoizedTextarea';

export { Textarea, textareaVariants };
