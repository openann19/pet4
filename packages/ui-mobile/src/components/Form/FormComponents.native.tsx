/**
 * Form Field Components
 * Additional form components for field management, sections, and utilities
 */

import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
} from '@petspark/motion';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import * as Haptics from 'expo-haptics';

import type {
    FormFieldProps,
    FormSectionProps,
    FormSubmitButtonProps,
} from './Form.types';
import {
    formSectionStyles,
    formConfig,
    accessibilityConstants,
    testIds,
} from './Form.config';
import { useForm, useFormField } from './Form.native';
import { FieldWrapper } from '../Label';

// Animated components
const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * Form Field Component
 * Connects form controls to form state management
 */
export const FormField = memo<FormFieldProps>(({
    name,
    children,
    validation,
    defaultValue,
    validateOnChange,
    validateOnBlur,
}) => {
    const field = useFormField(name, {
        ...(validation !== undefined && { validation }),
        ...(defaultValue !== undefined && { defaultValue }),
        ...(validateOnChange !== undefined && { validateOnChange }),
        ...(validateOnBlur !== undefined && { validateOnBlur }),
    });

    // Render children with field props
    if (typeof children === 'function') {
        return <>{children(field)}</>;
    }

    // If children is a React element, clone with field props
    if (React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            ...field,
            // Preserve existing props
            ...children.props,
        });
    }

    return <>{children}</>;
});

FormField.displayName = 'FormField';

/**
 * Form Section Component
 * Organizes form fields into collapsible sections
 */
export const FormSection = memo<FormSectionProps>(({
    title,
    description,
    children,
    style,
    collapsible = false,
    defaultCollapsed = false,
    testID,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const animationValue = useSharedValue(defaultCollapsed ? 0 : 1);

    const toggleCollapse = useCallback(() => {
        if (!collapsible) return;

        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);

        // Haptic feedback
        if (formConfig.haptics.enabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Animate
        animationValue.value = withTiming(newCollapsed ? 0 : 1, {
            duration: 300,
        });
    }, [collapsible, isCollapsed, animationValue]);

    const contentStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(animationValue.value, [0, 1], [0.3, 1]),
            transform: [
                {
                    scaleY: interpolate(animationValue.value, [0, 1], [0.95, 1]),
                },
            ],
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            maxHeight: isCollapsed ? 60 : undefined, // Header height when collapsed
            overflow: 'hidden' as const,
        };
    });

    return (
        <AnimatedView
            style={[
                formSectionStyles.container,
                style,
                containerStyle,
            ]}
            accessibilityRole={accessibilityConstants.roles.section}
            testID={testID || testIds.formSection}
        >
            {/* Section Header */}
            {(title || description) && (
                <Pressable
                    style={collapsible ? formSectionStyles.collapsible.header : undefined}
                    onPress={collapsible ? toggleCollapse : undefined}
                    accessibilityRole={collapsible ? 'button' : 'text'}
                    accessibilityState={collapsible ? { expanded: !isCollapsed } : undefined}
                    accessibilityHint={collapsible ? 'Tap to expand or collapse section' : undefined}
                >
                    {title && (
                        <Text style={formSectionStyles.title}>
                            {title}
                        </Text>
                    )}
                    {description && (
                        <Text style={formSectionStyles.description}>
                            {description}
                        </Text>
                    )}

                    {/* Collapse Indicator */}
                    {collapsible && (
                        <Text style={{ fontSize: 18, color: '#666' }}>
                            {isCollapsed ? '▼' : '▲'}
                        </Text>
                    )}
                </Pressable>
            )}

            {/* Section Content */}
            <AnimatedView style={contentStyle}>
                {children}
            </AnimatedView>
        </AnimatedView>
    );
});

FormSection.displayName = 'FormSection';

/**
 * Form Submit Button Component
 * Smart submit button that responds to form state
 */
export const FormSubmitButton = memo<FormSubmitButtonProps>(({
    children,
    style,
    disableOnInvalid = true,
    disableOnSubmitting = true,
    disabled: customDisabled = false,
    loading: customLoading = false,
    testID,
    ...buttonProps
}) => {
    const { formState, submitForm } = useForm();

    const isDisabled = customDisabled ||
        (disableOnInvalid && !formState.isValid) ||
        (disableOnSubmitting && formState.isSubmitting);

    const isLoading = customLoading || formState.isSubmitting;

    const handlePress = useCallback(() => {
        if (!isDisabled) {
            submitForm();
        }
    }, [isDisabled, submitForm]);

    return (
        <Pressable
            onPress={handlePress}
            disabled={isDisabled}
            style={[
                {
                    backgroundColor: isDisabled ? '#ccc' : '#007AFF',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                },
                style
            ]}
            testID={testID || testIds.submitButton}
            {...buttonProps}
        >
            <Text style={{ color: 'white', fontWeight: '600' }}>
                {isLoading ? 'Loading...' : children}
            </Text>
        </Pressable>
    );
});

FormSubmitButton.displayName = 'FormSubmitButton';

/**
 * Form Reset Button Component
 * Button to reset form to initial state
 */
export const FormResetButton = memo<{
    children: React.ReactNode;
    style?: any;
    testID?: string;
    [key: string]: any;
}>(({
    children,
    style,
    testID,
    ...buttonProps
}) => {
    const { resetForm, formState } = useForm();

    const handlePress = useCallback(() => {
        resetForm();
    }, [resetForm]);

    return (
        <Pressable
            onPress={handlePress}
            disabled={!formState.isDirty}
            style={[
                {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: '#007AFF',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                },
                style
            ]}
            testID={testID || testIds.resetButton}
            {...buttonProps}
        >
            <Text style={{ color: '#007AFF', fontWeight: '600' }}>
                {children}
            </Text>
        </Pressable>
    );
});

FormResetButton.displayName = 'FormResetButton';

/**
 * Connected Input Component
 * Input component pre-connected to form state
 */
export const FormInput = memo<{
    name: string;
    label?: string;
    placeholder?: string;
    validation?: any;
    [key: string]: any;
}>(({ name, label, validation, ...inputProps }) => {
    return (
        <FormField name={name} validation={validation}>
            {(field) => (
                <FieldWrapper
                    {...(label !== undefined && { label })}
                    required={validation?.required}
                    {...(field.error?.message !== undefined && { error: field.error.message })}
                >
                    {/* This would connect to your Input component */}
                    <View
                        style={{
                            height: 48,
                            borderWidth: 1,
                            borderColor: field.error ? '#ef4444' : '#d1d5db',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                        }}
                    >
                        <Text style={{ color: field.value ? '#000' : '#999' }}>
                            {field.value || inputProps.placeholder || ''}
                        </Text>
                    </View>
                </FieldWrapper>
            )}
        </FormField>
    );
});

FormInput.displayName = 'FormInput';
