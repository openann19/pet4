import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const toastVariants = cva(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
    {
        variants: {
            variant: {
                default: 'border bg-background text-foreground',
                destructive: 'border-destructive bg-destructive text-destructive-foreground',
                success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
                warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
                info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface ToastProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    onDismiss?: () => void;
}

const Toast = memo(forwardRef<HTMLDivElement, ToastProps>(
    ({ className, variant, title, description, action, onDismiss, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(toastVariants({ variant }), className)}
                role="alert"
                {...props}
            >
                <div className="grid gap-1">
                    {title && (
                        <div className="text-sm font-semibold">
                            {title}
                        </div>
                    )}
                    {description && (
                        <div className="text-sm opacity-90">
                            {description}
                        </div>
                    )}
                    {children}
                </div>
                {action && (
                    <button
                        onClick={action.onClick}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        {action.label}
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }
));

Toast.displayName = 'MemoizedToast';

export const useToast = () => {
    return {
        toast: (props: {
            title?: string;
            description?: string;
            variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
            action?: {
                label: string;
                onClick: () => void;
            };
            duration?: number;
        }) => {
            const { title, description, variant, action, duration } = props;

            return toast(title || description, {
                ...(description && title && { description }),
                ...(duration !== undefined && { duration }),
                ...(action && {
                    action: {
                        label: action.label,
                        onClick: action.onClick,
                    },
                }),
                className: toastVariants({ variant }),
            });
        },
        success: (message: string, options?: Omit<Parameters<typeof toast.success>[1], 'className'>) => {
            return toast.success(message, {
                ...options,
                className: toastVariants({ variant: 'success' }),
            });
        },
        error: (message: string, options?: Omit<Parameters<typeof toast.error>[1], 'className'>) => {
            return toast.error(message, {
                ...options,
                className: toastVariants({ variant: 'destructive' }),
            });
        },
        warning: (message: string, options?: Omit<Parameters<typeof toast.warning>[1], 'className'>) => {
            return toast.warning(message, {
                ...options,
                className: toastVariants({ variant: 'warning' }),
            });
        },
        info: (message: string, options?: Omit<Parameters<typeof toast.info>[1], 'className'>) => {
            return toast.info(message, {
                ...options,
                className: toastVariants({ variant: 'info' }),
            });
        },
        dismiss: toast.dismiss,
    };
};

export { Toast, toastVariants };
