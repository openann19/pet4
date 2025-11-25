import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const alertVariants = cva(
    'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    {
        variants: {
            variant: {
                default: 'bg-background text-foreground',
                destructive:
                    'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
                warning:
                    'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
                success:
                    'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
                info:
                    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const iconMap = {
    default: Info,
    destructive: XCircle,
    warning: AlertCircle,
    success: CheckCircle,
    info: Info,
} as const;

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    title?: string;
    showIcon?: boolean;
}

const Alert = memo(forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant, title, showIcon = true, children, ...props }, ref) => {
        const Icon = iconMap[variant || 'default'];

        return (
            <div
                ref={ref}
                role="alert"
                className={cn(alertVariants({ variant }), className)}
                {...props}
            >
                {showIcon && <Icon className="h-4 w-4" />}
                {title && (
                    <div className="pl-7">
                        <h5 className="mb-1 font-medium leading-none tracking-tight">
                            {title}
                        </h5>
                    </div>
                )}
                <div className={cn(title && 'pl-7', 'text-sm [&_p]:leading-relaxed')}>
                    {children}
                </div>
            </div>
        );
    }
));

Alert.displayName = 'MemoizedAlert';

export { Alert, alertVariants };
