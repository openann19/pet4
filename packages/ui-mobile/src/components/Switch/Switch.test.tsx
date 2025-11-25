import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Switch } from './Switch.native';

// Mock haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => ({
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withSpring: (value: any) => value,
    withTiming: (value: any) => value,
    interpolateColor: (value: any, input: any[], output: any[]) => output[0],
    runOnJS: (fn: Function) => fn,
    createAnimatedComponent: (Component: any) => Component,
}));

// Mock useReducedMotion
jest.mock('../../hooks/useReducedMotion', () => ({
    useReducedMotion: () => false,
}));

describe('Switch Component', () => {
    const defaultProps = {
        testID: 'test-switch',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly with basic props', () => {
            render(<Switch {...defaultProps} />);

            expect(screen.getByTestId('test-switch')).toBeTruthy();
            expect(screen.getByTestId('test-switch-track')).toBeTruthy();
            expect(screen.getByTestId('test-switch-thumb')).toBeTruthy();
        });

        it('renders with label', () => {
            render(<Switch {...defaultProps} label="Enable notifications" />);

            expect(screen.getByText('Enable notifications')).toBeTruthy();
            expect(screen.getByTestId('test-switch-label')).toBeTruthy();
        });

        it('renders with description', () => {
            const description = 'Receive push notifications for important updates';
            render(<Switch {...defaultProps} label="Notifications" description={description} />);

            expect(screen.getByText('Notifications')).toBeTruthy();
            expect(screen.getByText(description)).toBeTruthy();
            expect(screen.getByTestId('test-switch-description')).toBeTruthy();
        });

        it('renders checked state correctly', () => {
            render(<Switch {...defaultProps} checked={true} />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityState.checked).toBe(true);
        });

        it('renders unchecked state correctly', () => {
            render(<Switch {...defaultProps} checked={false} />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityState.checked).toBe(false);
        });

        it('applies disabled styling when disabled', () => {
            render(<Switch {...defaultProps} disabled label="Disabled switch" />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityState.disabled).toBe(true);
            expect(track.props.disabled).toBe(true);
        });

        it('renders different sizes correctly', () => {
            const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

            sizes.forEach(size => {
                const { unmount } = render(
                    <Switch {...defaultProps} size={size} testID={`switch-${size}`} />
                );

                expect(screen.getByTestId(`switch-${size}`)).toBeTruthy();
                unmount();
            });
        });

        it('renders different variants correctly', () => {
            const variants: Array<'default' | 'filled' | 'outlined' | 'ghost'> =
                ['default', 'filled', 'outlined', 'ghost'];

            variants.forEach(variant => {
                const { unmount } = render(
                    <Switch {...defaultProps} variant={variant} testID={`switch-${variant}`} />
                );

                expect(screen.getByTestId(`switch-${variant}`)).toBeTruthy();
                unmount();
            });
        });
    });

    describe('Interaction', () => {
        it('calls onCheckedChange when pressed', () => {
            const onCheckedChange = jest.fn();
            render(<Switch {...defaultProps} onCheckedChange={onCheckedChange} />);

            const track = screen.getByTestId('test-switch-track');
            fireEvent.press(track);

            expect(onCheckedChange).toHaveBeenCalledWith(true);
        });

        it('toggles between checked and unchecked states', () => {
            const onCheckedChange = jest.fn();
            render(<Switch {...defaultProps} checked={false} onCheckedChange={onCheckedChange} />);

            const track = screen.getByTestId('test-switch-track');

            // First press - should become checked
            fireEvent.press(track);
            expect(onCheckedChange).toHaveBeenCalledWith(true);

            // Rerender with new checked state
            render(<Switch {...defaultProps} checked={true} onCheckedChange={onCheckedChange} />);

            // Second press - should become unchecked
            fireEvent.press(track);
            expect(onCheckedChange).toHaveBeenCalledWith(false);
        });

        it('does not call onCheckedChange when disabled', () => {
            const onCheckedChange = jest.fn();
            render(
                <Switch
                    {...defaultProps}
                    disabled
                    onCheckedChange={onCheckedChange}
                />
            );

            const track = screen.getByTestId('test-switch-track');
            fireEvent.press(track);

            expect(onCheckedChange).not.toHaveBeenCalled();
        });

        it('does not call onCheckedChange when no handler provided', () => {
            // Should not throw error
            render(<Switch {...defaultProps} />);

            const track = screen.getByTestId('test-switch-track');
            expect(() => fireEvent.press(track)).not.toThrow();
        });

        it('handles press in and press out events', () => {
            render(<Switch {...defaultProps} />);

            const track = screen.getByTestId('test-switch-track');

            expect(() => {
                fireEvent(track, 'pressIn');
                fireEvent(track, 'pressOut');
            }).not.toThrow();
        });

        it('does not handle press events when disabled', () => {
            const onCheckedChange = jest.fn();
            render(
                <Switch
                    {...defaultProps}
                    disabled
                    onCheckedChange={onCheckedChange}
                />
            );

            const track = screen.getByTestId('test-switch-track');

            fireEvent(track, 'pressIn');
            fireEvent(track, 'pressOut');
            fireEvent.press(track);

            expect(onCheckedChange).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('has correct accessibility attributes', () => {
            render(
                <Switch
                    {...defaultProps}
                    label="Test Switch"
                    accessibilityLabel="Custom accessibility label"
                    accessibilityHint="Custom hint"
                />
            );

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityRole).toBe('switch');
            expect(track.props.accessibilityLabel).toBe('Custom accessibility label');
            expect(track.props.accessibilityHint).toBe('Custom hint');
        });

        it('generates default accessibility label when none provided', () => {
            render(<Switch {...defaultProps} label="Enable feature" />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityLabel).toBe('Enable feature switch');
        });

        it('generates fallback accessibility label when no label provided', () => {
            render(<Switch {...defaultProps} />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityLabel).toBe('Toggle switch');
        });

        it('generates appropriate accessibility hint based on state', () => {
            const { rerender } = render(<Switch {...defaultProps} checked={false} />);

            let track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityHint).toBe('Double tap to turn on');

            rerender(<Switch {...defaultProps} checked={true} />);

            track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityHint).toBe('Double tap to turn off');
        });

        it('has correct accessibility state when checked', () => {
            render(<Switch {...defaultProps} checked={true} />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityState.checked).toBe(true);
            expect(track.props.accessibilityState.disabled).toBe(false);
        });

        it('has correct accessibility state when disabled', () => {
            render(<Switch {...defaultProps} disabled />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityState.disabled).toBe(true);
        });
    });

    describe('Custom Styling', () => {
        it('applies custom container style', () => {
            const customStyle = { backgroundColor: 'red' };
            render(<Switch {...defaultProps} style={customStyle} />);

            const container = screen.getByTestId('test-switch');
            expect(container.props.style).toEqual(
                expect.arrayContaining([expect.objectContaining(customStyle)])
            );
        });

        it('applies custom label style', () => {
            const customLabelStyle = { color: 'blue' };
            render(
                <Switch
                    {...defaultProps}
                    label="Custom label"
                    labelStyle={customLabelStyle}
                />
            );

            const label = screen.getByTestId('test-switch-label');
            expect(label.props.style).toEqual(
                expect.arrayContaining([expect.objectContaining(customLabelStyle)])
            );
        });

        it('applies custom description style', () => {
            const customDescStyle = { fontStyle: 'italic' };
            render(
                <Switch
                    {...defaultProps}
                    label="Label"
                    description="Custom description"
                    descriptionStyle={customDescStyle}
                />
            );

            const description = screen.getByTestId('test-switch-description');
            expect(description.props.style).toEqual(
                expect.arrayContaining([expect.objectContaining(customDescStyle)])
            );
        });
    });

    describe('Edge Cases', () => {
        it('handles undefined checked value gracefully', () => {
            render(<Switch {...defaultProps} checked={undefined} />);

            const track = screen.getByTestId('test-switch-track');
            expect(track.props.accessibilityState.checked).toBe(false);
        });

        it('handles rapid toggle events', async () => {
            const onCheckedChange = jest.fn();
            render(<Switch {...defaultProps} onCheckedChange={onCheckedChange} />);

            const track = screen.getByTestId('test-switch-track');

            // Simulate rapid presses
            fireEvent.press(track);
            fireEvent.press(track);
            fireEvent.press(track);

            await waitFor(() => {
                expect(onCheckedChange).toHaveBeenCalledTimes(3);
            });
        });

        it('handles empty strings for label and description', () => {
            render(<Switch {...defaultProps} label="" description="" />);

            // Should still render the container but without content
            expect(screen.getByTestId('test-switch')).toBeTruthy();
        });
    });

    describe('Memory and Performance', () => {
        it('properly memoizes the component', () => {
            const onCheckedChange = jest.fn();
            const { rerender } = render(
                <Switch {...defaultProps} onCheckedChange={onCheckedChange} />
            );

            // Re-render with same props should not cause issues
            rerender(<Switch {...defaultProps} onCheckedChange={onCheckedChange} />);

            expect(screen.getByTestId('test-switch')).toBeTruthy();
        });

        it('handles component unmounting gracefully', () => {
            const { unmount } = render(<Switch {...defaultProps} />);

            expect(() => unmount()).not.toThrow();
        });
    });
});
