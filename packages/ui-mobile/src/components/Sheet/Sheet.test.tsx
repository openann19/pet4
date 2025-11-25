import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Sheet } from './Sheet.native';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({
        top: 44,
        bottom: 34,
        left: 0,
        right: 0,
    }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
}));

// Mock useReducedMotion
jest.mock('../../hooks/useReducedMotion', () => ({
    useReducedMotion: jest.fn(() => false),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
    get: jest.fn(() => ({ width: 375, height: 812 })),
}));

// Mock Keyboard
const mockKeyboard = {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
};
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => mockKeyboard);

describe('Sheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const TestContent = () => (
        <View>
            <Text>Sheet Content</Text>
        </View>
    );

    it('renders correctly when visible', () => {
        render(
            <Sheet visible={true} testID="sheet">
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();
        expect(screen.getByText('Sheet Content')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        render(
            <Sheet visible={false} testID="sheet">
                <TestContent />
            </Sheet>
        );

        expect(screen.queryByTestId('sheet')).toBeNull();
    });

    it('calls onClose when backdrop is pressed', () => {
        const onClose = jest.fn();
        render(
            <Sheet
                visible={true}
                onClose={onClose}
                backdropDismiss={true}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        // Find and press backdrop
        const backdrop = screen.getByLabelText('Close sheet');
        fireEvent.press(backdrop);

        expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose when backdrop is pressed and backdropDismiss is false', () => {
        const onClose = jest.fn();
        render(
            <Sheet
                visible={true}
                onClose={onClose}
                backdropDismiss={false}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        const backdrop = screen.getByLabelText('Close sheet');
        fireEvent.press(backdrop);

        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders drag handle when draggable is true', () => {
        render(
            <Sheet visible={true} draggable={true} testID="sheet">
                <TestContent />
            </Sheet>
        );

        expect(screen.getByLabelText('Drag to resize')).toBeTruthy();
    });

    it('does not render drag handle when draggable is false', () => {
        render(
            <Sheet visible={true} draggable={false} testID="sheet">
                <TestContent />
            </Sheet>
        );

        expect(screen.queryByLabelText('Drag to resize')).toBeNull();
    });

    it('applies correct accessibility attributes', () => {
        render(
            <Sheet
                visible={true}
                testID="sheet"
                accessibilityLabel="Custom sheet label"
            >
                <TestContent />
            </Sheet>
        );

        const sheet = screen.getByTestId('sheet');
        expect(sheet).toHaveProp('accessibilityRole', 'dialog');
        expect(sheet).toHaveProp('accessibilityLabel', 'Custom sheet label');
        expect(sheet).toHaveProp('accessibilityModal', true);
    });

    it('handles keyboard listeners when keyboardAvoidance is enabled', () => {
        render(
            <Sheet visible={true} keyboardAvoidance={true} testID="sheet">
                <TestContent />
            </Sheet>
        );

        expect(mockKeyboard.addListener).toHaveBeenCalledWith('keyboardDidShow', expect.any(Function));
        expect(mockKeyboard.addListener).toHaveBeenCalledWith('keyboardDidHide', expect.any(Function));
    });

    it('does not set up keyboard listeners when keyboardAvoidance is disabled', () => {
        mockKeyboard.addListener.mockClear();

        render(
            <Sheet visible={true} keyboardAvoidance={false} testID="sheet">
                <TestContent />
            </Sheet>
        );

        expect(mockKeyboard.addListener).not.toHaveBeenCalled();
    });

    it('handles custom snap points', () => {
        const snapPoints = [
            { height: 200, label: 'Small' },
            { height: 400, label: 'Medium' },
            { height: 600, label: 'Large' },
        ];

        const onSnapChange = jest.fn();

        render(
            <Sheet
                visible={true}
                snapPoints={snapPoints}
                onSnapChange={onSnapChange}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();
    });

    it('handles initial snap index', () => {
        const snapPoints = [
            { height: 200 },
            { height: 400 },
            { height: 600 },
        ];

        render(
            <Sheet
                visible={true}
                snapPoints={snapPoints}
                initialSnapIndex={1}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();
    });

    it('applies custom styles correctly', () => {
        const customStyle = { backgroundColor: 'red' };
        const customContentStyle = { padding: 20 };
        const customHandleStyle = { backgroundColor: 'blue' };

        render(
            <Sheet
                visible={true}
                draggable={true}
                style={customStyle}
                contentStyle={customContentStyle}
                handleStyle={customHandleStyle}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toHaveStyle(customStyle);
    });

    it('handles different sizes correctly', () => {
        const { rerender } = render(
            <Sheet visible={true} size="sm" testID="sheet">
                <TestContent />
            </Sheet>
        );
        expect(screen.getByTestId('sheet')).toBeTruthy();

        rerender(
            <Sheet visible={true} size="md" testID="sheet">
                <TestContent />
            </Sheet>
        );
        expect(screen.getByTestId('sheet')).toBeTruthy();

        rerender(
            <Sheet visible={true} size="lg" testID="sheet">
                <TestContent />
            </Sheet>
        );
        expect(screen.getByTestId('sheet')).toBeTruthy();
    });

    it('handles gesture and haptic feedback props', () => {
        render(
            <Sheet
                visible={true}
                gestureEnabled={true}
                hapticFeedback={true}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();
    });

    it('handles animation and spring config', () => {
        const customSpringConfig = {
            tension: 200,
            friction: 10,
        };

        render(
            <Sheet
                visible={true}
                animated={true}
                springConfig={customSpringConfig}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();
    });

    it('handles dismissible prop correctly', () => {
        const onClose = jest.fn();

        const { rerender } = render(
            <Sheet
                visible={true}
                dismissible={true}
                onClose={onClose}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();

        rerender(
            <Sheet
                visible={true}
                dismissible={false}
                onClose={onClose}
                testID="sheet"
            >
                <TestContent />
            </Sheet>
        );

        expect(screen.getByTestId('sheet')).toBeTruthy();
    });
});
