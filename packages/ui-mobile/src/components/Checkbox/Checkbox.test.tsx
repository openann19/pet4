import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Checkbox } from './Checkbox.native';
import { CheckboxGroup } from './CheckboxGroup.native';

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

describe('Checkbox', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with basic props', () => {
        render(
            <Checkbox
                label="Accept terms"
                testID="checkbox"
            />
        );

        expect(screen.getByTestId('checkbox')).toBeTruthy();
        expect(screen.getByTestId('checkbox-checkbox')).toBeTruthy();
        expect(screen.getByText('Accept terms')).toBeTruthy();
    });

    it('handles checked state changes', () => {
        const onCheckedChange = jest.fn();
        render(
            <Checkbox
                label="Test checkbox"
                onCheckedChange={onCheckedChange}
                testID="checkbox"
            />
        );

        const checkbox = screen.getByTestId('checkbox-checkbox');
        fireEvent.press(checkbox);

        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('handles controlled checked state', () => {
        const { rerender } = render(
            <Checkbox
                label="Controlled checkbox"
                checked={false}
                testID="checkbox"
            />
        );

        const checkbox = screen.getByTestId('checkbox-checkbox');
        expect(checkbox).toHaveProp('accessibilityState', { checked: false, disabled: false });

        rerender(
            <Checkbox
                label="Controlled checkbox"
                checked={true}
                testID="checkbox"
            />
        );

        expect(checkbox).toHaveProp('accessibilityState', { checked: true, disabled: false });
    });

    it('handles indeterminate state', () => {
        render(
            <Checkbox
                label="Indeterminate checkbox"
                indeterminate={true}
                testID="checkbox"
            />
        );

        const checkbox = screen.getByTestId('checkbox-checkbox');
        expect(checkbox).toHaveProp('accessibilityState', { checked: 'mixed', disabled: false });
        expect(screen.getByText('−')).toBeTruthy(); // indeterminate icon
    });

    it('transitions from indeterminate to checked when pressed', () => {
        const onCheckedChange = jest.fn();
        render(
            <Checkbox
                label="Indeterminate checkbox"
                indeterminate={true}
                onCheckedChange={onCheckedChange}
                testID="checkbox"
            />
        );

        const checkbox = screen.getByTestId('checkbox-checkbox');
        fireEvent.press(checkbox);

        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('displays custom icons', () => {
        render(
            <Checkbox
                label="Custom icon checkbox"
                checked={true}
                checkedIcon="✅"
                testID="checkbox"
            />
        );

        expect(screen.getByText('✅')).toBeTruthy();
    });

    it('displays error message', () => {
        render(
            <Checkbox
                label="Error checkbox"
                error="This field is required"
                testID="checkbox"
            />
        );

        expect(screen.getByTestId('checkbox-error')).toBeTruthy();
        expect(screen.getByText('This field is required')).toBeTruthy();
    });

    it('displays description', () => {
        render(
            <Checkbox
                label="Checkbox with description"
                description="This is additional information"
                testID="checkbox"
            />
        );

        expect(screen.getByText('This is additional information')).toBeTruthy();
    });

    it('shows required indicator', () => {
        render(
            <Checkbox
                label="Required checkbox"
                required={true}
                testID="checkbox"
            />
        );

        expect(screen.getByText('Required checkbox')).toBeTruthy();
        expect(screen.getByText(' *')).toBeTruthy();
    });

    it('handles disabled state', () => {
        const onCheckedChange = jest.fn();
        render(
            <Checkbox
                label="Disabled checkbox"
                disabled={true}
                onCheckedChange={onCheckedChange}
                testID="checkbox"
            />
        );

        const checkbox = screen.getByTestId('checkbox-checkbox');
        expect(checkbox).toHaveProp('disabled', true);

        fireEvent.press(checkbox);
        expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('handles different variants', () => {
        const { rerender } = render(
            <Checkbox label="Primary" variant="primary" testID="checkbox" />
        );
        expect(screen.getByTestId('checkbox')).toBeTruthy();

        rerender(<Checkbox label="Secondary" variant="secondary" testID="checkbox" />);
        expect(screen.getByTestId('checkbox')).toBeTruthy();

        rerender(<Checkbox label="Ghost" variant="ghost" testID="checkbox" />);
        expect(screen.getByTestId('checkbox')).toBeTruthy();
    });

    it('handles different sizes', () => {
        const { rerender } = render(
            <Checkbox label="Small" size="sm" testID="checkbox" />
        );
        expect(screen.getByTestId('checkbox')).toBeTruthy();

        rerender(<Checkbox label="Medium" size="md" testID="checkbox" />);
        expect(screen.getByTestId('checkbox')).toBeTruthy();

        rerender(<Checkbox label="Large" size="lg" testID="checkbox" />);
        expect(screen.getByTestId('checkbox')).toBeTruthy();
    });

    it('handles different shapes', () => {
        const { rerender } = render(
            <Checkbox label="Square" shape="square" testID="checkbox" />
        );
        expect(screen.getByTestId('checkbox')).toBeTruthy();

        rerender(<Checkbox label="Rounded" shape="rounded" testID="checkbox" />);
        expect(screen.getByTestId('checkbox')).toBeTruthy();
    });

    it('handles label positions', () => {
        const { rerender } = render(
            <Checkbox label="Right label" labelPosition="right" testID="checkbox" />
        );
        expect(screen.getByTestId('checkbox')).toBeTruthy();

        rerender(<Checkbox label="Left label" labelPosition="left" testID="checkbox" />);
        expect(screen.getByTestId('checkbox')).toBeTruthy();
    });

    it('applies correct accessibility attributes', () => {
        render(
            <Checkbox
                label="Accessible checkbox"
                accessibilityLabel="Custom accessibility label"
                testID="checkbox"
            />
        );

        const checkbox = screen.getByTestId('checkbox-checkbox');
        expect(checkbox).toHaveProp('accessibilityRole', 'checkbox');
        expect(checkbox).toHaveProp('accessibilityLabel', 'Custom accessibility label');
    });

    it('applies custom styles correctly', () => {
        const customContainerStyle = { backgroundColor: 'red' };
        const customCheckboxStyle = { borderColor: 'blue' };
        const customLabelStyle = { color: 'green' };

        render(
            <Checkbox
                label="Custom styled checkbox"
                containerStyle={customContainerStyle}
                checkboxStyle={customCheckboxStyle}
                labelStyle={customLabelStyle}
                testID="checkbox"
            />
        );

        expect(screen.getByTestId('checkbox')).toHaveStyle(customContainerStyle);
    });
});

describe('CheckboxGroup', () => {
    const TestCheckboxes = () => (
        <CheckboxGroup testID="checkbox-group">
            <Checkbox label="Option 1" value="option1" testID="checkbox1" />
            <Checkbox label="Option 2" value="option2" testID="checkbox2" />
            <Checkbox label="Option 3" value="option3" testID="checkbox3" />
        </CheckboxGroup>
    );

    it('renders checkbox group correctly', () => {
        render(<TestCheckboxes />);

        expect(screen.getByTestId('checkbox-group')).toBeTruthy();
        expect(screen.getByText('Option 1')).toBeTruthy();
        expect(screen.getByText('Option 2')).toBeTruthy();
        expect(screen.getByText('Option 3')).toBeTruthy();
    });

    it('handles multiple selections', () => {
        const onValueChange = jest.fn();
        render(
            <CheckboxGroup onValueChange={onValueChange} testID="checkbox-group">
                <Checkbox label="Option 1" value="option1" testID="checkbox1" />
                <Checkbox label="Option 2" value="option2" testID="checkbox2" />
            </CheckboxGroup>
        );

        const checkbox1 = screen.getByTestId('checkbox1-checkbox');
        const checkbox2 = screen.getByTestId('checkbox2-checkbox');

        fireEvent.press(checkbox1);
        expect(onValueChange).toHaveBeenCalledWith(['option1']);

        fireEvent.press(checkbox2);
        expect(onValueChange).toHaveBeenCalledWith(['option1', 'option2']);
    });

    it('handles controlled value', () => {
        const { rerender } = render(
            <CheckboxGroup value={['option1']} testID="checkbox-group">
                <Checkbox label="Option 1" value="option1" testID="checkbox1" />
                <Checkbox label="Option 2" value="option2" testID="checkbox2" />
            </CheckboxGroup>
        );

        expect(screen.getByTestId('checkbox-group')).toBeTruthy();

        rerender(
            <CheckboxGroup value={['option1', 'option2']} testID="checkbox-group">
                <Checkbox label="Option 1" value="option1" testID="checkbox1" />
                <Checkbox label="Option 2" value="option2" testID="checkbox2" />
            </CheckboxGroup>
        );

        expect(screen.getByTestId('checkbox-group')).toBeTruthy();
    });

    it('displays group error message', () => {
        render(
            <CheckboxGroup error="Please select at least one option" testID="checkbox-group">
                <Checkbox label="Option 1" value="option1" testID="checkbox1" />
            </CheckboxGroup>
        );

        expect(screen.getByTestId('checkbox-group-error')).toBeTruthy();
        expect(screen.getByText('Please select at least one option')).toBeTruthy();
    });

    it('handles disabled group', () => {
        render(
            <CheckboxGroup disabled={true} testID="checkbox-group">
                <Checkbox label="Option 1" value="option1" testID="checkbox1" />
            </CheckboxGroup>
        );

        expect(screen.getByTestId('checkbox-group')).toBeTruthy();
    });
});
