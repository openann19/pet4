/**
 * Form Component
 * Mobile-first form component with validation, state management, and accessibility
 *
 * Features:
 * - Built-in form state management
 * - Field validation with custom rules
 * - Accessibility optimized for screen readers
 * - Haptic feedback integration
 * - Animation support
 * - Error handling and display
 * - Form submission handling
 * - Field registration system
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect,
    memo
} from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import type {
    FormProps,
    FormContextValue,
    FormFieldProps,
    FormFieldRegistration,
    FormState,
    FormFieldState,
    FormFieldError,
    FormFieldConfig,
    FormSectionProps,
    FormSubmitButtonProps,
    FormSubmissionResult,
    ValidationConfig,
} from './Form.types';
import {
    formConfig,
    formLayouts,
    formSectionStyles,
    formErrorStyles,
    formSuccessStyles,
    validationUtils,
    accessibilityConstants,
    testIds,
    formAnimationPresets,
} from './Form.config';
import { Label, FieldWrapper } from '../Label';
import { Button } from '../Button';

// Create Form Context
const FormContext = createContext<FormContextValue | null>(null);

// Animated components
const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * Hook to access form context
 */
export const useForm = (): FormContextValue => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useForm must be used within a Form component');
    }
    return context;
};

/**
 * Hook for field registration and management
 */
export const useFormField = (name: string, config?: Partial<FormFieldConfig>): FormFieldRegistration => {
    const form = useForm();
    const fieldState = form.getFieldState(name);

    // Register field on mount
    useEffect(() => {
        const registration = form.register({
            name,
            defaultValue: config?.defaultValue,
            validation: config?.validation,
            validateOnChange: config?.validateOnChange ?? formConfig.defaultValidateOnChange,
            validateOnBlur: config?.validateOnBlur ?? formConfig.defaultValidateOnBlur,
        });

        // Return cleanup function
        return () => {
            form.unregister(name);
        };
    }, [name, form, config]);

    return {
        name,
        value: fieldState?.value ?? config?.defaultValue ?? '',
        error: fieldState?.error,
        touched: fieldState?.touched ?? false,
        onChange: (value: any) => {
            form.setValue(name, value);
            if (config?.validateOnChange || fieldState?.error) {
                form.validateField(name);
            }
        },
        onBlur: () => {
            const currentState = form.getFieldState(name);
            if (currentState && !currentState.touched) {
                // Mark as touched and validate if configured
                form.setValue(name, currentState.value); // This will trigger touched state
                if (config?.validateOnBlur) {
                    form.validateField(name);
                }
            }
        },
        onFocus: () => {
            // Clear field error on focus if it exists
            if (fieldState?.error) {
                form.clearFieldError(name);
            }
        },
    };
};

/**
 * Form Error Summary Component
 */
const FormErrorSummary = memo<{ errors: Record<string, FormFieldError> }>(({ errors }) => {
    const errorEntries = Object.entries(errors);

    if (errorEntries.length === 0) {
        return null;
    }

    return (
        <View style={formErrorStyles.container} testID={testIds.formError}>
            <Text style={formErrorStyles.title} accessibilityRole="alert">
                Form contains errors
            </Text>
            <View style={formErrorStyles.list}>
                {errorEntries.map(([fieldName, error]) => (
                    <Text key={fieldName} style={formErrorStyles.listItem}>
                        • {error.message}
                    </Text>
                ))}
            </View>
        </View>
    );
});

FormErrorSummary.displayName = 'FormErrorSummary';

/**
 * Form Success Message Component
 */
const FormSuccessMessage = memo<{ message: string }>(({ message }) => (
    <View style={formSuccessStyles.container} testID={testIds.formSuccess}>
        <Text
            style={formSuccessStyles.message}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
        >
            {message}
        </Text>
    </View>
));

FormSuccessMessage.displayName = 'FormSuccessMessage';

/**
 * Main Form Component
 */
export const Form = memo<FormProps>(({
    onSubmit,
    defaultValues = {},
    mode = formConfig.defaultMode,
    reValidateMode = formConfig.defaultReValidateMode,
    children,
    style,
    className,
    testID,
    disabled = false,
    autoFocus = formConfig.defaultAutoFocus,
    onReset,
    onStateChange,
    onValidationError,
}) => {
    // Form state
    const [formState, setFormState] = useState<FormState>({
        fields: {},
        isValid: true,
        isDirty: false,
        isSubmitting: false,
        submitCount: 0,
        errors: {},
    });

    // Field configurations
    const fieldConfigs = useRef<Record<string, FormFieldConfig>>({});

    // Form submission result
    const [submissionResult, setSubmissionResult] = useState<{
        success?: boolean;
        message?: string;
    }>({});

    // Animation values
    const shakeAnimation = useSharedValue(0);

    // Update form state helper
    const updateFormState = useCallback((updater: (prev: FormState) => FormState) => {
        setFormState(prev => {
            const next = updater(prev);
            onStateChange?.(next);
            return next;
        });
    }, [onStateChange]);

    // Validate single field
    const validateField = useCallback(async (name: string): Promise<boolean> => {
        const fieldConfig = fieldConfigs.current[name];
        const fieldState = formState.fields[name];

        if (!fieldConfig || !fieldState) {
            return true;
        }

        const error = validationUtils.validateValue(
            fieldState.value,
            fieldConfig.validation || {},
            // Get all form values for cross-field validation
            Object.fromEntries(
                Object.entries(formState.fields).map(([key, state]) => [key, state.value])
            )
        );

        updateFormState(prev => {
            const newFields = { ...prev.fields };
            newFields[name] = {
                ...newFields[name],
                error: error ? { message: error } : undefined,
                valid: !error,
            };

            const newErrors = { ...prev.errors };
            if (error) {
                newErrors[name] = { message: error };
            } else {
                delete newErrors[name];
            }

            return {
                ...prev,
                fields: newFields,
                errors: newErrors,
                isValid: Object.keys(newErrors).length === 0,
            };
        });

        return !error;
    }, [formState.fields, updateFormState]);

    // Validate all fields
    const validateForm = useCallback(async (): Promise<boolean> => {
        const fieldNames = Object.keys(fieldConfigs.current);
        const validationResults = await Promise.all(
            fieldNames.map(name => validateField(name))
        );

        const allValid = validationResults.every(Boolean);

        if (!allValid && formConfig.haptics.enabled) {
            // Haptic feedback for validation errors
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        return allValid;
    }, [validateField]);

    // Form submission
    const submitForm = useCallback(async (): Promise<void> => {
        if (disabled || formState.isSubmitting) {
            return;
        }

        updateFormState(prev => ({
            ...prev,
            isSubmitting: true,
            submitCount: prev.submitCount + 1,
        }));

        try {
            // Clear previous results
            setSubmissionResult({});

            // Validate form first
            const isValid = await validateForm();

            if (!isValid) {
                // Shake animation for validation errors
                shakeAnimation.value = withSpring(10, { damping: 10 }, () => {
                    shakeAnimation.value = withSpring(-10, { damping: 10 }, () => {
                        shakeAnimation.value = withSpring(0, { damping: 10 });
                    });
                });

                onValidationError?.(formState.errors);
                return;
            }

            // Prepare submission data
            const submissionData = validationUtils.sanitizeFormData(
                Object.fromEntries(
                    Object.entries(formState.fields).map(([key, field]) => [key, field.value])
                )
            );

            // Haptic feedback for submission
            if (formConfig.haptics.enabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            // Submit form
            const result = await onSubmit(submissionData);

            if (result.success) {
                setSubmissionResult({
                    success: true,
                    message: 'Form submitted successfully',
                });

                // Success haptic feedback
                if (formConfig.haptics.enabled) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else {
                // Handle submission errors
                if (result.errors) {
                    updateFormState(prev => ({
                        ...prev,
                        errors: { ...prev.errors, ...result.errors },
                    }));
                }

                setSubmissionResult({
                    success: false,
                    message: 'Form submission failed',
                });
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmissionResult({
                success: false,
                message: 'An unexpected error occurred',
            });

            // Error haptic feedback
            if (formConfig.haptics.enabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } finally {
            updateFormState(prev => ({
                ...prev,
                isSubmitting: false,
            }));
        }
    }, [
        disabled,
        formState.isSubmitting,
        formState.errors,
        updateFormState,
        validateForm,
        onSubmit,
        onValidationError,
        shakeAnimation
    ]);

    // Context value
    const contextValue = useMemo<FormContextValue>(() => ({
        formState,
        register: (config: FormFieldConfig) => {
            fieldConfigs.current[config.name] = config;

            // Initialize field state if not exists
            updateFormState(prev => {
                if (!prev.fields[config.name]) {
                    const newFields = { ...prev.fields };
                    newFields[config.name] = {
                        value: config.defaultValue ?? '',
                        error: undefined,
                        touched: false,
                        dirty: false,
                        valid: true,
                    };

                    return {
                        ...prev,
                        fields: newFields,
                    };
                }
                return prev;
            });

            return {
                name: config.name,
                value: formState.fields[config.name]?.value ?? config.defaultValue ?? '',
                error: formState.fields[config.name]?.error,
                touched: formState.fields[config.name]?.touched ?? false,
                onChange: (value: any) => {
                    updateFormState(prev => {
                        const newFields = { ...prev.fields };
                        const currentField = newFields[config.name];

                        newFields[config.name] = {
                            ...currentField,
                            value,
                            dirty: true,
                            touched: true,
                        };

                        return {
                            ...prev,
                            fields: newFields,
                            isDirty: true,
                        };
                    });

                    if (config.validateOnChange) {
                        validateField(config.name);
                    }
                },
                onBlur: () => {
                    updateFormState(prev => {
                        const newFields = { ...prev.fields };
                        if (newFields[config.name]) {
                            newFields[config.name] = {
                                ...newFields[config.name],
                                touched: true,
                            };
                        }

                        return {
                            ...prev,
                            fields: newFields,
                        };
                    });

                    if (config.validateOnBlur) {
                        validateField(config.name);
                    }
                },
                onFocus: () => {
                    // Clear field error on focus
                    updateFormState(prev => {
                        const newFields = { ...prev.fields };
                        if (newFields[config.name]?.error) {
                            newFields[config.name] = {
                                ...newFields[config.name],
                                error: undefined,
                            };

                            const newErrors = { ...prev.errors };
                            delete newErrors[config.name];

                            return {
                                ...prev,
                                fields: newFields,
                                errors: newErrors,
                                isValid: Object.keys(newErrors).length === 0,
                            };
                        }
                        return prev;
                    });
                },
            };
        },
        unregister: (name: string) => {
            delete fieldConfigs.current[name];
            updateFormState(prev => {
                const newFields = { ...prev.fields };
                delete newFields[name];

                const newErrors = { ...prev.errors };
                delete newErrors[name];

                return {
                    ...prev,
                    fields: newFields,
                    errors: newErrors,
                    isValid: Object.keys(newErrors).length === 0,
                };
            });
        },
        setValue: (name: string, value: any) => {
            updateFormState(prev => {
                const newFields = { ...prev.fields };
                if (newFields[name]) {
                    newFields[name] = {
                        ...newFields[name],
                        value,
                        dirty: true,
                        touched: true,
                    };
                }

                return {
                    ...prev,
                    fields: newFields,
                    isDirty: true,
                };
            });
        },
        getValue: (name: string) => formState.fields[name]?.value,
        getFieldState: (name: string) => formState.fields[name],
        setFieldError: (name: string, error: FormFieldError) => {
            updateFormState(prev => {
                const newFields = { ...prev.fields };
                if (newFields[name]) {
                    newFields[name] = {
                        ...newFields[name],
                        error,
                        valid: false,
                    };
                }

                const newErrors = { ...prev.errors, [name]: error };

                return {
                    ...prev,
                    fields: newFields,
                    errors: newErrors,
                    isValid: false,
                };
            });
        },
        clearFieldError: (name: string) => {
            updateFormState(prev => {
                const newFields = { ...prev.fields };
                if (newFields[name]?.error) {
                    newFields[name] = {
                        ...newFields[name],
                        error: undefined,
                        valid: true,
                    };
                }

                const newErrors = { ...prev.errors };
                delete newErrors[name];

                return {
                    ...prev,
                    fields: newFields,
                    errors: newErrors,
                    isValid: Object.keys(newErrors).length === 0,
                };
            });
        },
        clearErrors: () => {
            updateFormState(prev => {
                const newFields = { ...prev.fields };
                Object.keys(newFields).forEach(name => {
                    if (newFields[name].error) {
                        newFields[name] = {
                            ...newFields[name],
                            error: undefined,
                            valid: true,
                        };
                    }
                });

                return {
                    ...prev,
                    fields: newFields,
                    errors: {},
                    isValid: true,
                };
            });
        },
        validateField,
        validateForm,
        submitForm,
        resetForm: (values = {}) => {
            const newFields: Record<string, FormFieldState> = {};

            Object.keys(fieldConfigs.current).forEach(name => {
                const config = fieldConfigs.current[name];
                newFields[name] = {
                    value: values[name] ?? config.defaultValue ?? defaultValues[name] ?? '',
                    error: undefined,
                    touched: false,
                    dirty: false,
                    valid: true,
                };
            });

            setFormState({
                fields: newFields,
                isValid: true,
                isDirty: false,
                isSubmitting: false,
                submitCount: 0,
                errors: {},
            });

            setSubmissionResult({});
            onReset?.();
        },
        disabled,
    }), [
        formState,
        updateFormState,
        validateField,
        validateForm,
        submitForm,
        disabled,
        defaultValues,
        onReset,
    ]);

    // Shake animation style
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeAnimation.value }],
    }));

    // Initialize form with default values
    useEffect(() => {
        if (Object.keys(defaultValues).length > 0) {
            updateFormState(prev => {
                const newFields = { ...prev.fields };

                Object.entries(defaultValues).forEach(([name, value]) => {
                    if (!newFields[name]) {
                        newFields[name] = {
                            value,
                            error: undefined,
                            touched: false,
                            dirty: false,
                            valid: true,
                        };
                    }
                });

                return {
                    ...prev,
                    fields: newFields,
                };
            });
        }
    }, []); // Only run on mount

    return (
        <FormContext.Provider value={contextValue}>
            <AnimatedView
                style={[
                    formLayouts.default,
                    style,
                    animatedStyle,
                ]}
                accessibilityRole={accessibilityConstants.roles.form}
                testID={testID || testIds.form}
            >
                {/* Error Summary */}
                {Object.keys(formState.errors).length > 0 && (
                    <FormErrorSummary errors={formState.errors} />
                )}

                {/* Success Message */}
                {submissionResult.success && submissionResult.message && (
                    <FormSuccessMessage message={submissionResult.message} />
                )}

                {/* Form Content */}
                {children}
            </AnimatedView>
        </FormContext.Provider>
    );
});

Form.displayName = 'Form';

// Export the Form component as default
export default Form;
