import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Textarea } from './Textarea.native';

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

describe('Textarea', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with basic props', () => {
        render(
            <Textarea
                placeholder="Enter text here"
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea')).toBeTruthy();
        expect(screen.getByTestId('textarea-input')).toBeTruthy();
    });

    it('renders with label', () => {
        render(
            <Textarea
                label="Description"
                placeholder="Enter description"
                testID="textarea"
            />
        );

        expect(screen.getByText('Description')).toBeTruthy();
    });

    it('renders required indicator', () => {
        render(
            <Textarea
                label="Required Field"
                required={true}
                testID="textarea"
            />
        );

        expect(screen.getByText('Required Field')).toBeTruthy();
        expect(screen.getByText(' *')).toBeTruthy();
    });

    it('displays error message', () => {
        render(
            <Textarea
                error="This field is required"
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea-error')).toBeTruthy();
        expect(screen.getByText('This field is required')).toBeTruthy();
    });

    it('displays hint message when no error', () => {
        render(
            <Textarea
                hint="Enter a detailed description"
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea-hint')).toBeTruthy();
        expect(screen.getByText('Enter a detailed description')).toBeTruthy();
    });

    it('prioritizes error over hint', () => {
        render(
            <Textarea
                hint="Enter a detailed description"
                error="This field is required"
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea-error')).toBeTruthy();
        expect(screen.queryByTestId('textarea-hint')).toBeNull();
    });

    it('handles text input changes', () => {
        const onChangeText = jest.fn();
        render(
            <Textarea
                onChangeText={onChangeText}
                testID="textarea"
            />
        );

        const input = screen.getByTestId('textarea-input');
        fireEvent.changeText(input, 'Hello, World!');

        expect(onChangeText).toHaveBeenCalledWith('Hello, World!');
    });

    it('handles controlled value', () => {
        const { rerender } = render(
            <Textarea
                value="Initial value"
                testID="textarea"
            />
        );

        const input = screen.getByTestId('textarea-input');
        expect(input.props.value).toBe('Initial value');

        rerender(
            <Textarea
                value="Updated value"
                testID="textarea"
            />
        );

        expect(input.props.value).toBe('Updated value');
    });

    it('displays character count with maxLength', () => {
        render(
            <Textarea
                maxLength={100}
                showCharCount={true}
                value="Hello"
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea-char-count')).toBeTruthy();
        expect(screen.getByText('5/100')).toBeTruthy();
    });

    it('enforces maxLength constraint', () => {
        const onChangeText = jest.fn();
        render(
            <Textarea
                maxLength={5}
                onChangeText={onChangeText}
                testID="textarea"
            />
        );

        const input = screen.getByTestId('textarea-input');
        fireEvent.changeText(input, 'This is a long text');

        expect(onChangeText).toHaveBeenCalledWith('This ');
    });

    it('handles focus and blur events', () => {
        const onFocus = jest.fn();
        const onBlur = jest.fn();

        render(
            <Textarea
                onFocus={onFocus}
                onBlur={onBlur}
                testID="textarea"
            />
        );

        const input = screen.getByTestId('textarea-input');

        fireEvent(input, 'focus');
        expect(onFocus).toHaveBeenCalled();

        fireEvent(input, 'blur');
        expect(onBlur).toHaveBeenCalled();
    });

    it('renders left icon', () => {
        const onLeftIconPress = jest.fn();
        render(
            <Textarea
                leftIcon="📝"
                onLeftIconPress={onLeftIconPress}
                testID="textarea"
            />
        );

        const leftIcon = screen.getByTestId('textarea-left-icon');
        expect(leftIcon).toBeTruthy();
        expect(screen.getByText('📝')).toBeTruthy();

        fireEvent.press(leftIcon);
        expect(onLeftIconPress).toHaveBeenCalled();
    });

    it('renders right icon', () => {
        const onRightIconPress = jest.fn();
        render(
            <Textarea
                rightIcon="🔍"
                onRightIconPress={onRightIconPress}
                testID="textarea"
            />
        );

        const rightIcon = screen.getByTestId('textarea-right-icon');
        expect(rightIcon).toBeTruthy();
        expect(screen.getByText('🔍')).toBeTruthy();

        fireEvent.press(rightIcon);
        expect(onRightIconPress).toHaveBeenCalled();
    });

    it('handles disabled state', () => {
        render(
            <Textarea
                disabled={true}
                testID="textarea"
            />
        );

        const input = screen.getByTestId('textarea-input');
        expect(input.props.editable).toBe(false);
    });

    it('applies correct accessibility attributes', () => {
        render(
            <Textarea
                label="Description"
                hint="Enter your description here"
                testID="textarea"
            />
        );

        const input = screen.getByTestId('textarea-input');
        expect(input).toHaveProp('accessibilityLabel', 'Description');
        expect(input).toHaveProp('accessibilityHint', 'Enter your description here');
    });

    it('handles different sizes correctly', () => {
        const { rerender } = render(
            <Textarea size="sm" testID="textarea" />
        );
        expect(screen.getByTestId('textarea')).toBeTruthy();

        rerender(<Textarea size="md" testID="textarea" />);
        expect(screen.getByTestId('textarea')).toBeTruthy();

        rerender(<Textarea size="lg" testID="textarea" />);
        expect(screen.getByTestId('textarea')).toBeTruthy();
    });

    it('handles different variants correctly', () => {
        const { rerender } = render(
            <Textarea variant="primary" testID="textarea" />
        );
        expect(screen.getByTestId('textarea')).toBeTruthy();

        rerender(<Textarea variant="secondary" testID="textarea" />);
        expect(screen.getByTestId('textarea')).toBeTruthy();

        rerender(<Textarea variant="ghost" testID="textarea" />);
        expect(screen.getByTestId('textarea')).toBeTruthy();
    });

    it('applies custom styles correctly', () => {
        const customContainerStyle = { backgroundColor: 'red' };
        const customInputStyle = { color: 'blue' };
        const customLabelStyle = { fontSize: 20 };

        render(
            <Textarea
                label="Custom styled textarea"
                containerStyle={customContainerStyle}
                inputStyle={customInputStyle}
                labelStyle={customLabelStyle}
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea')).toHaveStyle(customContainerStyle);
    });

    it('handles auto resize configuration', () => {
        const { rerender } = render(
            <Textarea autoResize={true} testID="textarea" />
        );
        expect(screen.getByTestId('textarea')).toBeTruthy();

        rerender(<Textarea autoResize={false} testID="textarea" />);
        expect(screen.getByTestId('textarea')).toBeTruthy();
    });

    it('handles rows configuration', () => {
        render(
            <Textarea rows={6} testID="textarea" />
        );

        expect(screen.getByTestId('textarea')).toBeTruthy();
    });

    it('handles minHeight and maxHeight', () => {
        render(
            <Textarea
                minHeight={100}
                maxHeight={300}
                autoResize={true}
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea')).toBeTruthy();
    });

    it('handles animation and haptic feedback props', () => {
        render(
            <Textarea
                animated={true}
                hapticFeedback={true}
                testID="textarea"
            />
        );

        expect(screen.getByTestId('textarea')).toBeTruthy();
    });
});
