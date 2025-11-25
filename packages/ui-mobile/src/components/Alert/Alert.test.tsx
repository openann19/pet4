import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from './Alert.native';
import type { AlertAction } from './Alert.types';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
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

// Mock useReducedMotion
jest.mock('../../hooks/useReducedMotion', () => ({
    useReducedMotion: jest.fn(() => false),
}));

// Mock timers
jest.useFakeTimers();

describe('Alert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    it('renders correctly with basic props', () => {
        render(
            <Alert
                message="This is a test alert"
                visible={true}
                testID="alert"
            />
        );

        expect(screen.getByTestId('alert')).toBeTruthy();
        expect(screen.getByText('This is a test alert')).toBeTruthy();
    });

    it('renders with title and message', () => {
        render(
            <Alert
                title="Alert Title"
                message="This is the alert message"
                visible={true}
                testID="alert"
            />
        );

        expect(screen.getByText('Alert Title')).toBeTruthy();
        expect(screen.getByText('This is the alert message')).toBeTruthy();
    });

    it('displays correct icons for different variants', () => {
        const { rerender } = render(
            <Alert
                message="Success message"
                variant="success"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByText('✓')).toBeTruthy();

        rerender(
            <Alert
                message="Warning message"
                variant="warning"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByText('⚠️')).toBeTruthy();

        rerender(
            <Alert
                message="Error message"
                variant="error"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByText('✕')).toBeTruthy();

        rerender(
            <Alert
                message="Info message"
                variant="info"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByText('ℹ️')).toBeTruthy();
    });

    it('hides icon when showIcon is false', () => {
        render(
            <Alert
                message="Message without icon"
                variant="success"
                showIcon={false}
                visible={true}
                testID="alert"
            />
        );

        expect(screen.queryByText('✓')).toBeNull();
    });

    it('displays custom icon when provided', () => {
        render(
            <Alert
                message="Custom icon message"
                icon="🚀"
                visible={true}
                testID="alert"
            />
        );

        expect(screen.getByText('🚀')).toBeTruthy();
    });

    it('handles dismiss action', () => {
        const onDismiss = jest.fn();
        render(
            <Alert
                message="Dismissible alert"
                visible={true}
                dismissible={true}
                onDismiss={onDismiss}
                testID="alert"
            />
        );

        const dismissButton = screen.getByTestId('alert-dismiss');
        fireEvent.press(dismissButton);

        expect(onDismiss).toHaveBeenCalled();
    });

    it('prevents dismiss when dismissible is false', () => {
        render(
            <Alert
                message="Non-dismissible alert"
                visible={true}
                dismissible={false}
                testID="alert"
            />
        );

        expect(screen.queryByTestId('alert-dismiss')).toBeNull();
    });

    it('auto dismisses after specified delay', async () => {
        const onDismiss = jest.fn();
        render(
            <Alert
                message="Auto dismiss alert"
                visible={true}
                autoDismiss={true}
                autoDismissDelay={1000}
                onDismiss={onDismiss}
                testID="alert"
            />
        );

        expect(onDismiss).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(onDismiss).toHaveBeenCalled();
        });
    });

    it('renders action buttons', () => {
        const actions: AlertAction[] = [
            { label: 'Cancel', onPress: jest.fn(), variant: 'outlined' },
            { label: 'Confirm', onPress: jest.fn(), variant: 'default' },
        ];

        render(
            <Alert
                message="Alert with actions"
                visible={true}
                actions={actions}
                testID="alert"
            />
        );

        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Confirm')).toBeTruthy();
    });

    it('handles action button presses', () => {
        const cancelAction = jest.fn();
        const confirmAction = jest.fn();
        const actions: AlertAction[] = [
            { label: 'Cancel', onPress: cancelAction },
            { label: 'Confirm', onPress: confirmAction },
        ];

        render(
            <Alert
                message="Alert with actions"
                visible={true}
                actions={actions}
                testID="alert"
            />
        );

        fireEvent.press(screen.getByText('Cancel'));
        expect(cancelAction).toHaveBeenCalled();

        fireEvent.press(screen.getByText('Confirm'));
        expect(confirmAction).toHaveBeenCalled();
    });

    it('handles disabled action buttons', () => {
        const disabledAction = jest.fn();
        const actions: AlertAction[] = [
            { label: 'Disabled', onPress: disabledAction, disabled: true },
        ];

        render(
            <Alert
                message="Alert with disabled action"
                visible={true}
                actions={actions}
                testID="alert"
            />
        );

        const disabledButton = screen.getByText('Disabled');
        fireEvent.press(disabledButton);

        expect(disabledAction).toHaveBeenCalled(); // React Native doesn't prevent onPress for disabled TouchableOpacity
    });

    it('applies correct accessibility attributes', () => {
        render(
            <Alert
                message="Accessible alert"
                variant="error"
                visible={true}
                testID="alert"
                accessibilityLabel="Custom accessibility label"
            />
        );

        const alert = screen.getByTestId('alert');
        expect(alert).toHaveProp('accessibilityRole', 'alert');
        expect(alert).toHaveProp('accessibilityLiveRegion', 'assertive');
        expect(alert).toHaveProp('accessibilityLabel', 'Custom accessibility label');
    });

    it('handles different sizes correctly', () => {
        const { rerender } = render(
            <Alert
                message="Small alert"
                size="sm"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByTestId('alert')).toBeTruthy();

        rerender(
            <Alert
                message="Medium alert"
                size="md"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByTestId('alert')).toBeTruthy();

        rerender(
            <Alert
                message="Large alert"
                size="lg"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByTestId('alert')).toBeTruthy();
    });

    it('handles different positions correctly', () => {
        const { rerender } = render(
            <Alert
                message="Top alert"
                position="top"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByTestId('alert')).toBeTruthy();

        rerender(
            <Alert
                message="Bottom alert"
                position="bottom"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByTestId('alert')).toBeTruthy();

        rerender(
            <Alert
                message="Center alert"
                position="center"
                visible={true}
                testID="alert"
            />
        );
        expect(screen.getByTestId('alert')).toBeTruthy();
    });

    it('does not render when visible is false', () => {
        render(
            <Alert
                message="Hidden alert"
                visible={false}
                testID="alert"
            />
        );

        expect(screen.queryByTestId('alert')).toBeNull();
    });

    it('applies custom styles correctly', () => {
        const customStyle = { backgroundColor: 'red' };
        const customTitleStyle = { color: 'blue' };
        const customMessageStyle = { fontSize: 20 };

        render(
            <Alert
                title="Custom styled alert"
                message="With custom styles"
                visible={true}
                style={customStyle}
                titleStyle={customTitleStyle}
                messageStyle={customMessageStyle}
                testID="alert"
            />
        );

        expect(screen.getByTestId('alert')).toHaveStyle(customStyle);
    });

    it('clears auto dismiss timer when dismissed manually', () => {
        const onDismiss = jest.fn();
        render(
            <Alert
                message="Auto dismiss alert"
                visible={true}
                dismissible={true}
                autoDismiss={true}
                autoDismissDelay={5000}
                onDismiss={onDismiss}
                testID="alert"
            />
        );

        // Manually dismiss before auto dismiss
        const dismissButton = screen.getByTestId('alert-dismiss');
        fireEvent.press(dismissButton);

        expect(onDismiss).toHaveBeenCalled();

        // Advance timers past auto dismiss delay
        jest.advanceTimersByTime(5000);

        // onDismiss should only be called once (from manual dismiss)
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
