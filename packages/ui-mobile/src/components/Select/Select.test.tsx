import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Select } from './Select.native';
import type { SelectOption } from './Select.types';

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
    createAnimatedComponent: (Component: any) => Component,
}));

const mockOptions: SelectOption[] = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3', disabled: true },
    { label: 'Option 4', value: 'option4', description: 'This is option 4' },
];

describe('Select Component', () => {
    const defaultProps = {
        options: mockOptions,
        testID: 'test-select',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly with basic props', () => {
            render(<Select {...defaultProps} />);

            expect(screen.getByTestId('test-select')).toBeTruthy();
            expect(screen.getByTestId('test-select-trigger')).toBeTruthy();
        });

        it('renders with label', () => {
            render(<Select {...defaultProps} label="Test Label" />);

            expect(screen.getByText('Test Label')).toBeTruthy();
        });

        it('renders with required indicator', () => {
            render(<Select {...defaultProps} label="Test Label" required />);

            expect(screen.getByText('Test Label')).toBeTruthy();
            expect(screen.getByText(' *')).toBeTruthy();
        });

        it('renders placeholder text', () => {
            const placeholder = 'Choose an option';
            render(<Select {...defaultProps} placeholder={placeholder} />);

            expect(screen.getByText(placeholder)).toBeTruthy();
        });

        it('renders selected value in single select', () => {
            render(<Select {...defaultProps} value="option1" />);

            expect(screen.getByText('Option 1')).toBeTruthy();
        });

        it('renders selected count in multi-select', () => {
            render(
                <Select
                    {...defaultProps}
                    value={['option1', 'option2']}
                    multiSelect
                />
            );

            expect(screen.getByText('Option 1, Option 2')).toBeTruthy();
        });

        it('renders selected count when exceeding max display items', () => {
            render(
                <Select
                    {...defaultProps}
                    value={['option1', 'option2', 'option4']}
                    multiSelect
                    maxDisplayItems={2}
                />
            );

            expect(screen.getByText('3 selected')).toBeTruthy();
        });

        it('renders helper text', () => {
            const helperText = 'This is helper text';
            render(<Select {...defaultProps} helperText={helperText} />);

            expect(screen.getByText(helperText)).toBeTruthy();
        });

        it('renders error message', () => {
            const error = 'This is an error';
            render(<Select {...defaultProps} error={error} />);

            expect(screen.getByText(error)).toBeTruthy();
        });

        it('applies disabled styling when disabled', () => {
            render(<Select {...defaultProps} disabled />);

            const trigger = screen.getByTestId('test-select-trigger');
            expect(trigger.props.accessibilityState.disabled).toBe(true);
        });
    });

    describe('Interaction', () => {
        it('opens modal when trigger is pressed', async () => {
            render(<Select {...defaultProps} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                expect(screen.getByText('Select Option')).toBeTruthy();
            });
        });

        it('does not open modal when disabled', () => {
            render(<Select {...defaultProps} disabled />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            expect(screen.queryByText('Select Option')).toBeNull();
        });

        it('calls onSelectionChange when option is selected', async () => {
            const onSelectionChange = jest.fn();
            render(<Select {...defaultProps} onSelectionChange={onSelectionChange} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const option = screen.getByText('Option 1');
                fireEvent.press(option);
            });

            expect(onSelectionChange).toHaveBeenCalledWith('option1');
        });

        it('handles multi-select correctly', async () => {
            const onSelectionChange = jest.fn();
            render(
                <Select
                    {...defaultProps}
                    multiSelect
                    onSelectionChange={onSelectionChange}
                />
            );

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const option1 = screen.getByText('Option 1');
                fireEvent.press(option1);
            });

            expect(onSelectionChange).toHaveBeenCalledWith(['option1']);

            await waitFor(() => {
                const option2 = screen.getByText('Option 2');
                fireEvent.press(option2);
            });

            expect(onSelectionChange).toHaveBeenCalledWith(['option1', 'option2']);
        });

        it('deselects option in multi-select when already selected', async () => {
            const onSelectionChange = jest.fn();
            render(
                <Select
                    {...defaultProps}
                    multiSelect
                    value={['option1']}
                    onSelectionChange={onSelectionChange}
                />
            );

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const option1 = screen.getByText('Option 1');
                fireEvent.press(option1);
            });

            expect(onSelectionChange).toHaveBeenCalledWith([]);
        });

        it('closes modal when pressing backdrop', async () => {
            render(<Select {...defaultProps} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                expect(screen.getByText('Select Option')).toBeTruthy();
            });

            const backdrop = screen.getByLabelText('Close select modal');
            fireEvent.press(backdrop);

            await waitFor(() => {
                expect(screen.queryByText('Select Option')).toBeNull();
            });
        });

        it('closes modal when pressing close button', async () => {
            render(<Select {...defaultProps} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                expect(screen.getByText('Select Option')).toBeTruthy();
            });

            const closeButton = screen.getByLabelText('Close');
            fireEvent.press(closeButton);

            await waitFor(() => {
                expect(screen.queryByText('Select Option')).toBeNull();
            });
        });
    });

    describe('Search Functionality', () => {
        it('renders search input when searchable is true', async () => {
            render(<Select {...defaultProps} searchable />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                expect(screen.getByTestId('test-select-search')).toBeTruthy();
            });
        });

        it('filters options based on search query', async () => {
            render(<Select {...defaultProps} searchable />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const searchInput = screen.getByTestId('test-select-search');
                fireEvent.changeText(searchInput, 'Option 1');
            });

            await waitFor(() => {
                expect(screen.getByText('Option 1')).toBeTruthy();
                expect(screen.queryByText('Option 2')).toBeNull();
            });
        });

        it('shows empty state when no options match search', async () => {
            render(<Select {...defaultProps} searchable emptyMessage="No matches" />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const searchInput = screen.getByTestId('test-select-search');
                fireEvent.changeText(searchInput, 'nonexistent');
            });

            await waitFor(() => {
                expect(screen.getByText('No matches')).toBeTruthy();
            });
        });
    });

    describe('Accessibility', () => {
        it('has correct accessibility attributes', () => {
            render(
                <Select
                    {...defaultProps}
                    label="Test Select"
                    accessibilityLabel="Custom accessibility label"
                    accessibilityHint="Custom hint"
                />
            );

            const trigger = screen.getByTestId('test-select-trigger');
            expect(trigger.props.accessibilityRole).toBe('button');
            expect(trigger.props.accessibilityLabel).toBe('Custom accessibility label');
            expect(trigger.props.accessibilityHint).toBe('Custom hint');
        });

        it('has correct accessibility state when disabled', () => {
            render(<Select {...defaultProps} disabled />);

            const trigger = screen.getByTestId('test-select-trigger');
            expect(trigger.props.accessibilityState.disabled).toBe(true);
        });

        it('options have correct accessibility attributes', async () => {
            render(<Select {...defaultProps} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const option = screen.getByTestId('test-select-option-option1');
                expect(option.props.accessibilityRole).toBe('button');
                expect(option.props.accessibilityLabel).toBe('Option 1');
                expect(option.props.accessibilityState.selected).toBe(false);
            });
        });

        it('selected options have correct accessibility state', async () => {
            render(<Select {...defaultProps} value="option1" />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const option = screen.getByTestId('test-select-option-option1');
                expect(option.props.accessibilityState.selected).toBe(true);
            });
        });

        it('disabled options have correct accessibility state', async () => {
            render(<Select {...defaultProps} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const option = screen.getByTestId('test-select-option-option3');
                expect(option.props.accessibilityState.disabled).toBe(true);
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles empty options array', () => {
            render(<Select {...defaultProps} options={[]} />);

            expect(screen.getByTestId('test-select')).toBeTruthy();
        });

        it('handles undefined value gracefully', () => {
            render(<Select {...defaultProps} value={undefined} />);

            expect(screen.getByText('Select an option...')).toBeTruthy();
        });

        it('handles invalid selected values', () => {
            render(<Select {...defaultProps} value="invalid-option" />);

            expect(screen.getByText('Select an option...')).toBeTruthy();
        });

        it('does not call onSelectionChange when disabled option is pressed', async () => {
            const onSelectionChange = jest.fn();
            render(<Select {...defaultProps} onSelectionChange={onSelectionChange} />);

            const trigger = screen.getByTestId('test-select-trigger');
            fireEvent.press(trigger);

            await waitFor(() => {
                const disabledOption = screen.getByText('Option 3');
                fireEvent.press(disabledOption);
            });

            expect(onSelectionChange).not.toHaveBeenCalled();
        });
    });
});
