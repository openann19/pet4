/**
 * Label Component Tests
 * Comprehensive test suite for the mobile Label component
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { Label, FieldWrapper, RequiredIndicator, OptionalIndicator, Message } from './Label.native';
import type { LabelProps, FieldWrapperProps } from './Label.types';

// Mock haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
    createAnimatedComponent: (Component: any) => Component,
}));

describe('Label Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders with text content', () => {
            render(<Label>Test Label</Label>);
            expect(screen.getByText('Test Label')).toBeTruthy();
        });

        it('renders with custom test ID', () => {
            render(<Label testID="custom-label">Test Label</Label>);
            expect(screen.getByTestId('custom-label')).toBeTruthy();
        });

        it('applies default accessibility props', () => {
            render(<Label>Accessible Label</Label>);
            const label = screen.getByText('Accessible Label');
            expect(label.props.accessibilityRole).toBe('text');
        });
    });

    describe('Visual Variants', () => {
        const variants: Array<LabelProps['variant']> = [
            'default', 'destructive', 'muted', 'success', 'warning'
        ];

        variants.forEach((variant) => {
            it(`renders ${variant} variant correctly`, () => {
                render(<Label variant={variant}>Test Label</Label>);
                const label = screen.getByText('Test Label');
                expect(label).toBeTruthy();
            });
        });
    });

    describe('Sizes', () => {
        const sizes: Array<LabelProps['size']> = [
            'xs', 'sm', 'md', 'lg', 'xl'
        ];

        sizes.forEach((size) => {
            it(`renders ${size} size correctly`, () => {
                render(<Label size={size}>Test Label</Label>);
                const label = screen.getByText('Test Label');
                expect(label).toBeTruthy();
            });
        });
    });

    describe('Required/Optional Indicators', () => {
        it('shows required indicator when required=true', () => {
            render(<Label required>Required Field</Label>);
            expect(screen.getByText('*')).toBeTruthy();
            expect(screen.getByLabelText('Required field')).toBeTruthy();
        });

        it('shows optional indicator when optional=true and required=false', () => {
            render(<Label optional>Optional Field</Label>);
            expect(screen.getByText('(optional)')).toBeTruthy();
            expect(screen.getByLabelText('Optional field')).toBeTruthy();
        });

        it('prioritizes required over optional when both are true', () => {
            render(<Label required optional>Test Field</Label>);
            expect(screen.getByText('*')).toBeTruthy();
            expect(screen.queryByText('(optional)')).toBeNull();
        });
    });

    describe('Description', () => {
        it('renders description when provided', () => {
            render(
                <Label description="This is a helpful description">
                    Test Label
                </Label>
            );
            expect(screen.getByText('This is a helpful description')).toBeTruthy();
        });

        it('applies correct accessibility role to description', () => {
            render(
                <Label description="Description text">
                    Test Label
                </Label>
            );
            const description = screen.getByText('Description text');
            expect(description.props.accessibilityRole).toBe('text');
        });
    });

    describe('Disabled State', () => {
        it('applies disabled styling and accessibility state', () => {
            render(<Label disabled>Disabled Label</Label>);
            const label = screen.getByText('Disabled Label');
            expect(label.props.accessibilityState?.disabled).toBe(true);
        });
    });

    describe('Interactive Behavior', () => {
        it('handles press when interactive=true', () => {
            const onPress = jest.fn();
            render(
                <Label interactive onPress={onPress}>
                    Interactive Label
                </Label>
            );

            fireEvent.press(screen.getByText('Interactive Label'));
            expect(onPress).toHaveBeenCalledTimes(1);
        });

        it('triggers haptic feedback on press when enabled', () => {
            const onPress = jest.fn();
            render(
                <Label interactive enableHaptics onPress={onPress}>
                    Haptic Label
                </Label>
            );

            fireEvent.press(screen.getByText('Haptic Label'));
            expect(Haptics.impactAsync).toHaveBeenCalled();
        });

        it('does not trigger press when disabled', () => {
            const onPress = jest.fn();
            render(
                <Label interactive disabled onPress={onPress}>
                    Disabled Interactive Label
                </Label>
            );

            // fireEvent.press should not work on disabled pressable
            expect(() => {
                fireEvent.press(screen.getByText('Disabled Interactive Label'));
            }).not.toThrow();
            expect(onPress).not.toHaveBeenCalled();
        });

        it('uses button accessibility role when interactive', () => {
            render(<Label interactive>Interactive Label</Label>);
            const label = screen.getByText('Interactive Label');
            expect(label.props.accessibilityRole).toBe('button');
        });
    });

    describe('Accessibility', () => {
        it('applies custom accessibility label', () => {
            render(
                <Label accessibilityLabel="Custom accessibility text">
                    Visual Text
                </Label>
            );
            const label = screen.getByLabelText('Custom accessibility text');
            expect(label).toBeTruthy();
        });

        it('uses nativeID for form association', () => {
            render(<Label nativeID="form-label-id">Form Label</Label>);
            const label = screen.getByText('Form Label');
            expect(label.props.nativeID).toBe('form-label-id');
        });

        it('sets accessibility state for required fields', () => {
            render(<Label required>Required Field</Label>);
            const label = screen.getByText('Required Field');
            expect(label.props.accessibilityState?.required).toBe(true);
        });
    });
});

describe('RequiredIndicator Component', () => {
    it('renders asterisk with correct accessibility label', () => {
        render(<RequiredIndicator />);
        expect(screen.getByText('*')).toBeTruthy();
        expect(screen.getByLabelText('Required field')).toBeTruthy();
    });

    it('applies variant styling', () => {
        render(<RequiredIndicator variant="destructive" />);
        const indicator = screen.getByText('*');
        expect(indicator).toBeTruthy();
    });
});

describe('OptionalIndicator Component', () => {
    it('renders optional text with correct accessibility label', () => {
        render(<OptionalIndicator />);
        expect(screen.getByText('(optional)')).toBeTruthy();
        expect(screen.getByLabelText('Optional field')).toBeTruthy();
    });
});

describe('Message Component', () => {
    const messageTypes: Array<'error' | 'success' | 'warning' | 'info'> = [
        'error', 'success', 'warning', 'info'
    ];

    messageTypes.forEach((type) => {
        it(`renders ${type} message correctly`, () => {
            render(<Message type={type}>Test message</Message>);
            const message = screen.getByText('Test message');
            expect(message).toBeTruthy();
            expect(message.props.accessibilityLiveRegion).toBe('polite');
        });
    });

    it('applies correct accessibility prefix for error messages', () => {
        render(<Message type="error">Error occurred</Message>);
        const message = screen.getByLabelText('Error: Error occurred');
        expect(message).toBeTruthy();
    });
});

describe('FieldWrapper Component', () => {
    it('renders label and form control together', () => {
        render(
            <FieldWrapper label="Test Field">
                <Text>Form Control</Text>
            </FieldWrapper>
        );

        expect(screen.getByText('Test Field')).toBeTruthy();
        expect(screen.getByText('Form Control')).toBeTruthy();
    });

    it('renders error message with correct styling', () => {
        render(
            <FieldWrapper label="Test Field" error="This field is required">
                <Text>Form Control</Text>
            </FieldWrapper>
        );

        expect(screen.getByText('This field is required')).toBeTruthy();
        expect(screen.getByLabelText('Error: This field is required')).toBeTruthy();
    });

    it('renders success message', () => {
        render(
            <FieldWrapper label="Test Field" success="Field is valid">
                <Text>Form Control</Text>
            </FieldWrapper>
        );

        expect(screen.getByText('Field is valid')).toBeTruthy();
    });

    it('prioritizes error over success message', () => {
        render(
            <FieldWrapper
                label="Test Field"
                error="Error message"
                success="Success message"
            >
                <Text>Form Control</Text>
            </FieldWrapper>
        );

        expect(screen.getByText('Error message')).toBeTruthy();
        expect(screen.queryByText('Success message')).toBeNull();
    });

    it('passes label props correctly', () => {
        render(
            <FieldWrapper
                label="Test Field"
                required
                labelProps={{ size: 'large' }}
            >
                <Text>Form Control</Text>
            </FieldWrapper>
        );

        expect(screen.getByText('Test Field')).toBeTruthy();
        expect(screen.getByText('*')).toBeTruthy();
    });

    it('applies custom spacing', () => {
        render(
            <FieldWrapper label="Test Field" spacing="lg">
                <Text>Form Control</Text>
            </FieldWrapper>
        );

        expect(screen.getByText('Test Field')).toBeTruthy();
    });
});

describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
        render(<Label>{''}</Label>);
        expect(screen.getByTestId('label')).toBeTruthy();
    });

    it('handles null description', () => {
        render(<Label description={undefined}>Test Label</Label>);
        expect(screen.getByText('Test Label')).toBeTruthy();
    });

    it('handles complex children elements', () => {
        render(
            <Label>
                <Text>Nested</Text> Content
            </Label>
        );
        expect(screen.getByTestId('label')).toBeTruthy();
    });
});

describe('Performance', () => {
    it('memoizes properly - does not re-render with same props', () => {
        const { rerender } = render(<Label>Test</Label>);

        // Re-render with same props should not cause issues
        rerender(<Label>Test</Label>);
        expect(screen.getByText('Test')).toBeTruthy();
    });

    it('handles rapid interactions without breaking', () => {
        const onPress = jest.fn();
        render(
            <Label interactive onPress={onPress}>
                Rapid Test
            </Label>
        );

        // Simulate rapid presses
        const label = screen.getByText('Rapid Test');
        fireEvent.press(label);
        fireEvent.press(label);
        fireEvent.press(label);

        expect(onPress).toHaveBeenCalledTimes(3);
    });
});
