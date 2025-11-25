/**
 * Form Component Tests
 * Comprehensive test suite for the mobile Form component and related utilities
 */

import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import { View, TextInput, Text } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import {
    Form,
    useForm,
    useFormField,
    FormField,
    FormSection,
    FormSubmitButton,
    FormResetButton,
    FormInput
} from './Form.native';
import { FormField as FormFieldComponent } from './FormComponents.native';
import type { FormSubmissionResult, ValidationConfig } from './Form.types';
import { validationRules, validationUtils } from './Form.config';

// Mock dependencies
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
    },
}));

jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
    interpolate: jest.fn(() => 0),
    createAnimatedComponent: (Component: any) => Component,
}));

// Test components
const TestInput: React.FC<{
    name: string;
    placeholder?: string;
    validation?: ValidationConfig;
    testID?: string;
}> = ({ name, placeholder, validation, testID }) => {
    const field = useFormField(name, { validation });

    return (
        <View>
            <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onFocus={field.onFocus}
                placeholder={placeholder}
                testID={testID}
                style={{
                    height: 40,
                    borderWidth: 1,
                    borderColor: field.error ? 'red' : 'gray',
                    paddingHorizontal: 8,
                }}
            />
            {field.error && (
                <Text testID={`${testID}-error`} style={{ color: 'red' }}>
                    {field.error.message}
                </Text>
            )}
        </View>
    );
};

const TestForm: React.FC<{
    onSubmit: (data: any) => Promise<FormSubmissionResult>;
    defaultValues?: Record<string, any>;
    children?: React.ReactNode;
}> = ({ onSubmit, defaultValues, children }) => (
    <Form onSubmit={onSubmit} defaultValues={defaultValues} testID="test-form">
        {children}
    </Form>
);

describe('Form Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Rendering and Context', () => {
        it('renders form with children', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <Text>Form Content</Text>
                </TestForm>
            );

            expect(screen.getByText('Form Content')).toBeTruthy();
            expect(screen.getByTestId('test-form')).toBeTruthy();
        });

        it('provides form context to children', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            const ContextConsumer = () => {
                const form = useForm();
                return <Text testID="context-test">Context: {form ? 'Available' : 'Missing'}</Text>;
            };

            render(
                <TestForm onSubmit={onSubmit}>
                    <ContextConsumer />
                </TestForm>
            );

            expect(screen.getByText('Context: Available')).toBeTruthy();
        });

        it('throws error when useForm is used outside Form', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const BadComponent = () => {
                useForm();
                return <Text>Should not render</Text>;
            };

            expect(() => render(<BadComponent />)).toThrow(
                'useForm must be used within a Form component'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Form Fields', () => {
        it('registers and manages field state', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="email" placeholder="Email" testID="email-input" />
                </TestForm>
            );

            const input = screen.getByTestId('email-input');
            expect(input.props.value).toBe('');

            // Type in input
            fireEvent.changeText(input, 'test@example.com');
            expect(input.props.value).toBe('test@example.com');
        });

        it('handles field validation on blur', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="email"
                        testID="email-input"
                        validation={{
                            required: true,
                            pattern: validationRules.email()
                        }}
                    />
                </TestForm>
            );

            const input = screen.getByTestId('email-input');

            // Enter invalid email
            fireEvent.changeText(input, 'invalid-email');
            fireEvent(input, 'blur');

            await waitFor(() => {
                expect(screen.getByTestId('email-input-error')).toBeTruthy();
            });
        });

        it('clears errors on focus', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="email"
                        testID="email-input"
                        validation={{ required: true }}
                    />
                </TestForm>
            );

            const input = screen.getByTestId('email-input');

            // Trigger required validation
            fireEvent(input, 'blur');

            await waitFor(() => {
                expect(screen.getByTestId('email-input-error')).toBeTruthy();
            });

            // Focus should clear error
            fireEvent(input, 'focus');

            await waitFor(() => {
                expect(screen.queryByTestId('email-input-error')).toBeNull();
            });
        });

        it('handles default values', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm
                    onSubmit={onSubmit}
                    defaultValues={{ email: 'default@example.com' }}
                >
                    <TestInput name="email" testID="email-input" />
                </TestForm>
            );

            const input = screen.getByTestId('email-input');
            expect(input.props.value).toBe('default@example.com');
        });
    });

    describe('Form Validation', () => {
        it('validates required fields', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="name"
                        testID="name-input"
                        validation={{ required: 'Name is required' }}
                    />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            const submitBtn = screen.getByTestId('submit-btn');
            fireEvent.press(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('Name is required')).toBeTruthy();
            });

            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('validates email format', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="email"
                        testID="email-input"
                        validation={{
                            required: true,
                            pattern: validationRules.email()
                        }}
                    />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            const input = screen.getByTestId('email-input');
            const submitBtn = screen.getByTestId('submit-btn');

            fireEvent.changeText(input, 'invalid-email');
            fireEvent.press(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
            });
        });

        it('validates minimum length', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="password"
                        testID="password-input"
                        validation={{
                            minLength: validationRules.minLength(8)
                        }}
                    />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            const input = screen.getByTestId('password-input');
            const submitBtn = screen.getByTestId('submit-btn');

            fireEvent.changeText(input, 'short');
            fireEvent.press(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('Must be at least 8 characters')).toBeTruthy();
            });
        });

        it('validates custom rules', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            const customValidation = {
                custom: [(value: string) => value === 'forbidden' ? 'This value is not allowed' : undefined]
            };

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="username"
                        testID="username-input"
                        validation={customValidation}
                    />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            const input = screen.getByTestId('username-input');
            const submitBtn = screen.getByTestId('submit-btn');

            fireEvent.changeText(input, 'forbidden');
            fireEvent.press(submitBtn);

            await waitFor(() => {
                expect(screen.getByText('This value is not allowed')).toBeTruthy();
            });
        });
    });

    describe('Form Submission', () => {
        it('submits form with valid data', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="name" testID="name-input" />
                    <TestInput name="email" testID="email-input" />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.changeText(screen.getByTestId('name-input'), 'John Doe');
            fireEvent.changeText(screen.getByTestId('email-input'), 'john@example.com');

            fireEvent.press(screen.getByTestId('submit-btn'));

            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith({
                    name: 'John Doe',
                    email: 'john@example.com',
                });
            });
        });

        it('handles submission errors', async () => {
            const onSubmit = jest.fn().mockResolvedValue({
                success: false,
                errors: { email: { message: 'Email already exists' } }
            });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="email" testID="email-input" />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.changeText(screen.getByTestId('email-input'), 'existing@example.com');
            fireEvent.press(screen.getByTestId('submit-btn'));

            await waitFor(() => {
                expect(screen.getByText('Email already exists')).toBeTruthy();
            });
        });

        it('shows loading state during submission', async () => {
            let resolveSubmit: (value: any) => void;
            const submitPromise = new Promise(resolve => {
                resolveSubmit = resolve;
            });

            const onSubmit = jest.fn().mockReturnValue(submitPromise);

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="email" testID="email-input" />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
            fireEvent.press(screen.getByTestId('submit-btn'));

            // Button should be in loading state
            await waitFor(() => {
                const submitBtn = screen.getByTestId('submit-btn');
                expect(submitBtn.props.accessibilityState?.busy).toBe(true);
            });

            // Resolve the submission
            act(() => {
                resolveSubmit!({ success: true });
            });
        });

        it('provides haptic feedback on submission', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="email" testID="email-input" />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
            fireEvent.press(screen.getByTestId('submit-btn'));

            await waitFor(() => {
                expect(Haptics.impactAsync).toHaveBeenCalled();
            });
        });
    });

    describe('FormField Component', () => {
        it('renders with render prop pattern', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <FormField name="test">
                        {(field) => (
                            <Text testID="field-value">Value: {field.value || 'empty'}</Text>
                        )}
                    </FormField>
                </TestForm>
            );

            expect(screen.getByText('Value: empty')).toBeTruthy();
        });

        it('clones children with field props', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            const CustomInput = (props: any) => (
                <Text testID="custom-input">
                    Custom: {props.value || 'no value'} - {props.error?.message || 'no error'}
                </Text>
            );

            render(
                <TestForm onSubmit={onSubmit}>
                    <FormField name="test">
                        <CustomInput />
                    </FormField>
                </TestForm>
            );

            expect(screen.getByText('Custom: no value - no error')).toBeTruthy();
        });
    });

    describe('FormSection Component', () => {
        it('renders section with title and description', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <FormSection
                        title="Personal Information"
                        description="Enter your personal details"
                        testID="personal-section"
                    >
                        <Text>Section Content</Text>
                    </FormSection>
                </TestForm>
            );

            expect(screen.getByText('Personal Information')).toBeTruthy();
            expect(screen.getByText('Enter your personal details')).toBeTruthy();
            expect(screen.getByText('Section Content')).toBeTruthy();
        });

        it('handles collapsible sections', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <FormSection
                        title="Collapsible Section"
                        collapsible
                        testID="collapsible-section"
                    >
                        <Text testID="section-content">Section Content</Text>
                    </FormSection>
                </TestForm>
            );

            const section = screen.getByTestId('collapsible-section');
            expect(screen.getByText('Section Content')).toBeTruthy();

            // Toggle collapse
            const header = screen.getByText('Collapsible Section');
            fireEvent.press(header);

            expect(Haptics.impactAsync).toHaveBeenCalled();
        });
    });

    describe('FormResetButton Component', () => {
        it('resets form to initial state', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="name" testID="name-input" />
                    <FormResetButton testID="reset-btn">Reset</FormResetButton>
                </TestForm>
            );

            const input = screen.getByTestId('name-input');
            const resetBtn = screen.getByTestId('reset-btn');

            // Change input value
            fireEvent.changeText(input, 'Test Name');
            expect(input.props.value).toBe('Test Name');

            // Reset form
            fireEvent.press(resetBtn);

            await waitFor(() => {
                expect(input.props.value).toBe('');
            });
        });
    });

    describe('Validation Utils', () => {
        it('validates required values correctly', () => {
            const config = { required: true };

            expect(validationUtils.validateValue('', config)).toBe('This field is required');
            expect(validationUtils.validateValue(null, config)).toBe('This field is required');
            expect(validationUtils.validateValue(undefined, config)).toBe('This field is required');
            expect(validationUtils.validateValue('value', config)).toBeUndefined();
        });

        it('validates email pattern correctly', () => {
            const config = { pattern: validationRules.email() };

            expect(validationUtils.validateValue('invalid', config)).toBe('Please enter a valid email address');
            expect(validationUtils.validateValue('test@example.com', config)).toBeUndefined();
        });

        it('validates minimum length correctly', () => {
            const config = { minLength: validationRules.minLength(5) };

            expect(validationUtils.validateValue('abc', config)).toBe('Must be at least 5 characters');
            expect(validationUtils.validateValue('abcdef', config)).toBeUndefined();
        });

        it('sanitizes form data correctly', () => {
            const data = {
                name: '  John Doe  ',
                email: 'test@example.com',
                empty: '',
                nullValue: null,
                undefinedValue: undefined,
                arrayEmpty: [],
                objectEmpty: {},
            };

            const sanitized = validationUtils.sanitizeFormData(data);

            expect(sanitized).toEqual({
                name: 'John Doe',
                email: 'test@example.com',
            });
        });
    });

    describe('Error Handling', () => {
        it('displays form-level errors', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="field1"
                        testID="field1"
                        validation={{ required: 'Field 1 is required' }}
                    />
                    <TestInput
                        name="field2"
                        testID="field2"
                        validation={{ required: 'Field 2 is required' }}
                    />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.press(screen.getByTestId('submit-btn'));

            await waitFor(() => {
                expect(screen.getByText('Form contains errors')).toBeTruthy();
                expect(screen.getByText('• Field 1 is required')).toBeTruthy();
                expect(screen.getByText('• Field 2 is required')).toBeTruthy();
            });
        });

        it('shows success message after successful submission', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput name="email" testID="email-input" />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
            fireEvent.press(screen.getByTestId('submit-btn'));

            await waitFor(() => {
                expect(screen.getByText('Form submitted successfully')).toBeTruthy();
            });
        });
    });

    describe('Accessibility', () => {
        it('applies correct accessibility roles', () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <FormSection title="Section" testID="section">
                        <Text>Content</Text>
                    </FormSection>
                </TestForm>
            );

            const form = screen.getByTestId('test-form');
            const section = screen.getByTestId('section');

            expect(form.props.accessibilityRole).toBe('form');
            expect(section.props.accessibilityRole).toBe('region');
        });

        it('announces errors with live regions', async () => {
            const onSubmit = jest.fn().mockResolvedValue({ success: true });

            render(
                <TestForm onSubmit={onSubmit}>
                    <TestInput
                        name="email"
                        testID="email-input"
                        validation={{ required: true }}
                    />
                    <FormSubmitButton testID="submit-btn">Submit</FormSubmitButton>
                </TestForm>
            );

            fireEvent.press(screen.getByTestId('submit-btn'));

            await waitFor(() => {
                const errorSummary = screen.getByText('Form contains errors');
                expect(errorSummary.props.accessibilityRole).toBe('alert');
            });
        });
    });
});
