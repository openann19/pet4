import React, { forwardRef, memo } from 'react';
import {
    FormProvider,
    useFormContext,
    type UseFormReturn,
    type FieldValues,
    type SubmitHandler,
    type SubmitErrorHandler
} from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldContextValue {
    name: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
    {} as FormFieldContextValue
);

interface FormItemContextValue {
    id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
    {} as FormItemContextValue
);

const FormField = memo(({ children, name }: { children: React.ReactNode; name: string }) => {
    return (
        <FormFieldContext.Provider value={{ name }}>
            {children}
        </FormFieldContext.Provider>
    );
});

FormField.displayName = 'FormField';

const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();

    const fieldState = getFieldState(fieldContext.name, formState);

    if (!fieldContext) {
        throw new Error('useFormField should be used within <FormField>');
    }

    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
};

const FormItem = memo(forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const id = React.useId();

        return (
            <FormItemContext.Provider value={{ id }}>
                <div ref={ref} className={cn('space-y-2', className)} {...props} />
            </FormItemContext.Provider>
        );
    }
));

FormItem.displayName = 'FormItem';

const FormLabel = memo(forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => {
        const { error, formItemId } = useFormField();

        return (
            <label
                ref={ref}
                className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    error && 'text-destructive',
                    className
                )}
                htmlFor={formItemId}
                {...props}
            />
        );
    }
));

FormLabel.displayName = 'FormLabel';

const FormControl = memo(({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
        <div
            aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
            aria-invalid={!!error}
            id={formItemId}
            {...props}
        />
    );
});

FormControl.displayName = 'FormControl';

const FormDescription = memo(
    forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
        ({ className, ...props }, ref) => {
            const { formDescriptionId } = useFormField();

            return (
                <p
                    ref={ref}
                    id={formDescriptionId}
                    className={cn('text-sm text-muted-foreground', className)}
                    {...props}
                />
            );
        }
    )
);

FormDescription.displayName = 'FormDescription';

const FormMessage = memo(
    forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
        ({ className, children, ...props }, ref) => {
            const { error, formMessageId } = useFormField();
            const body = error ? String(error?.message) : children;

            if (!body) {
                return null;
            }

            return (
                <p
                    ref={ref}
                    id={formMessageId}
                    className={cn('text-sm font-medium text-destructive', className)}
                    {...props}
                >
                    {body}
                </p>
            );
        }
    )
);

FormMessage.displayName = 'FormMessage';

interface FormProps<T extends FieldValues = FieldValues>
    extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onError'> {
    form: UseFormReturn<T>;
    onSubmit?: SubmitHandler<T>;
    onError?: SubmitErrorHandler<T>;
}

function Form<T extends FieldValues = FieldValues>({
    children,
    form,
    onSubmit,
    onError,
    className,
    ...props
}: FormProps<T>) {
    const handleSubmit = form.handleSubmit(onSubmit || (() => { }), onError);

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit} className={cn(className)} {...props}>
                {children}
            </form>
        </FormProvider>
    );
}

export {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormField,
    useFormField,
};
export type { FormProps };
