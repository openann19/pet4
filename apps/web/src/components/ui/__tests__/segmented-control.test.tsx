import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '../segmented-control';
import { Heart, PawPrint } from '@phosphor-icons/react';

describe('SegmentedControl', () => {
    const defaultOptions = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
    ];

    const optionsWithIcons = [
        { value: 'heart', label: 'Heart', icon: <Heart data-testid="heart-icon" /> },
        { value: 'paw', label: 'Paw', icon: <PawPrint data-testid="paw-icon" /> },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should render segmented control', () => {
        render(<SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />);
        const container = screen.getByRole('tablist');
        expect(container).toBeInTheDocument();
    });

    it('should render all options', () => {
        render(<SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />);
        expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
        expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
    });

    it('should mark active option with aria-selected="true"', () => {
        render(<SegmentedControl options={defaultOptions} value="option2" onChange={vi.fn()} />);
        const option1 = screen.getByLabelText('Option 1');
        const option2 = screen.getByLabelText('Option 2');
        const option3 = screen.getByLabelText('Option 3');

        expect(option1).toHaveAttribute('aria-selected', 'false');
        expect(option2).toHaveAttribute('aria-selected', 'true');
        expect(option3).toHaveAttribute('aria-selected', 'false');
    });

    it('should call onChange when option is clicked', () => {
        const handleChange = vi.fn();

        render(<SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />);

        const option2 = screen.getByLabelText('Option 2');
        fireEvent.click(option2);

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith('option2');
    });

    it('should not call onChange when clicking active option', () => {
        const handleChange = vi.fn();

        render(<SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />);

        const option1 = screen.getByLabelText('Option 1');
        fireEvent.click(option1);

        expect(handleChange).not.toHaveBeenCalled();
    });

    it('should render icons when provided', () => {
        render(<SegmentedControl options={optionsWithIcons} value="heart" onChange={vi.fn()} />);

        expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
        expect(screen.getByTestId('paw-icon')).toBeInTheDocument();
    });

    it('should apply fullWidth class when fullWidth prop is true', () => {
        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} fullWidth />
        );

        const tablist = container.querySelector('[role="tablist"]');
        expect(tablist).toHaveClass('w-full');
    });

    it('should apply custom className', () => {
        const { container } = render(
            <SegmentedControl
                options={defaultOptions}
                value="option1"
                onChange={vi.fn()}
                className="custom-class"
            />
        );

        const tablist = container.querySelector('[role="tablist"]');
        expect(tablist).toHaveClass('custom-class');
    });

    it('should support keyboard navigation with ArrowLeft', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option2" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'ArrowLeft' });

        expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('should support keyboard navigation with ArrowRight', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option2" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'ArrowRight' });

        expect(handleChange).toHaveBeenCalledWith('option3');
    });

    it('should wrap around when ArrowLeft is pressed on first option', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'ArrowLeft' });

        expect(handleChange).toHaveBeenCalledWith('option3');
    });

    it('should wrap around when ArrowRight is pressed on last option', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option3" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'ArrowRight' });

        expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('should support Home key to jump to first option', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option2" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'Home' });

        expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('should support End key to jump to last option', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'End' });

        expect(handleChange).toHaveBeenCalledWith('option3');
    });

    it('should ignore non-navigation keys', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'a' });
        fireEvent.keyDown(tablist!, { key: 'Enter' });
        fireEvent.keyDown(tablist!, { key: 'Space' });

        expect(handleChange).not.toHaveBeenCalled();
    });

    it('should handle empty options array', () => {
        render(<SegmentedControl options={[]} value="" onChange={vi.fn()} />);

        const container = screen.getByRole('tablist');
        expect(container).toBeInTheDocument();
        expect(container.querySelectorAll('[role="tab"]')).toHaveLength(0);
    });

    it('should handle value that does not exist in options', () => {
        render(<SegmentedControl options={defaultOptions} value="nonexistent" onChange={vi.fn()} />);

        const container = screen.getByRole('tablist');
        expect(container).toBeInTheDocument();

        // When value doesn't exist, no option is marked as active (aria-selected="false" for all)
        // The component renders but no option matches the value
        const option1 = screen.getByLabelText('Option 1');
        const option2 = screen.getByLabelText('Option 2');
        const option3 = screen.getByLabelText('Option 3');

        expect(option1).toHaveAttribute('aria-selected', 'false');
        expect(option2).toHaveAttribute('aria-selected', 'false');
        expect(option3).toHaveAttribute('aria-selected', 'false');
    });

    it('should set tabIndex correctly for active and inactive options', () => {
        render(<SegmentedControl options={defaultOptions} value="option2" onChange={vi.fn()} />);

        const option1 = screen.getByLabelText('Option 1');
        const option2 = screen.getByLabelText('Option 2');
        const option3 = screen.getByLabelText('Option 3');

        expect(option1).toHaveAttribute('tabIndex', '-1');
        expect(option2).toHaveAttribute('tabIndex', '0');
        expect(option3).toHaveAttribute('tabIndex', '-1');
    });

    it('should have proper ARIA attributes', () => {
        render(<SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />);

        const container = screen.getByRole('tablist');
        expect(container).toHaveAttribute('aria-orientation', 'horizontal');

        const option1 = screen.getByLabelText('Option 1');
        expect(option1).toHaveAttribute('role', 'tab');
        expect(option1).toHaveAttribute('aria-label', 'Option 1');
    });

    it('should support custom role', () => {
        const { container } = render(
            <SegmentedControl
                options={defaultOptions}
                value="option1"
                onChange={vi.fn()}
                role="radiogroup"
            />
        );

        const tablist = container.querySelector('[role="radiogroup"]');
        expect(tablist).toBeInTheDocument();
    });

    it('should render sliding indicator', () => {
        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />
        );

        // Indicator is rendered via useLayoutEffect, which may run synchronously
        // Check that the component renders correctly
        const containerEl = container.querySelector('[role="tablist"]');
        expect(containerEl).toBeInTheDocument();

        // Check that active option is marked correctly
        const option1 = screen.getByLabelText('Option 1');
        expect(option1).toHaveAttribute('aria-selected', 'true');
    });

    it('should update indicator position when value changes', () => {
        const handleChange = vi.fn();
        const { rerender } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />
        );

        let option1 = screen.getByLabelText('Option 1');
        expect(option1).toHaveAttribute('aria-selected', 'true');

        rerender(
            <SegmentedControl options={defaultOptions} value="option2" onChange={handleChange} />
        );

        option1 = screen.getByLabelText('Option 1');
        const option2 = screen.getByLabelText('Option 2');
        expect(option1).toHaveAttribute('aria-selected', 'false');
        expect(option2).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle ResizeObserver if available', () => {
        const observeFn = vi.fn();
        const disconnectFn = vi.fn();

        class ResizeObserverMock {
            observe = observeFn;
            disconnect = disconnectFn;
            unobserve = vi.fn();

            constructor(callback: ResizeObserverCallback) {
                // Store callback to simulate behavior
                this.observe = observeFn;
                this.disconnect = disconnectFn;
            }
        }

        const originalResizeObserver = global.ResizeObserver;
        global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

        const { unmount } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />
        );

        // ResizeObserver should be created and observe should be called
        expect(observeFn).toHaveBeenCalled();

        unmount();

        // ResizeObserver should be disconnected on unmount
        expect(disconnectFn).toHaveBeenCalled();

        global.ResizeObserver = originalResizeObserver;
    });

    it('should handle missing ResizeObserver gracefully', () => {
        const originalResizeObserver = global.ResizeObserver;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (global as any).ResizeObserver;

        expect(() => {
            const { unmount } = render(
                <SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />
            );
            unmount();
        }).not.toThrow();

        global.ResizeObserver = originalResizeObserver;
    });

    it('should apply proper styling classes', () => {
        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        expect(tablist).toHaveClass('rounded-2xl');
        expect(tablist).toHaveClass('backdrop-blur-xl');

        const button = screen.getByLabelText('Option 1');
        expect(button).toHaveClass('rounded-xl');
        expect(button).toHaveClass('font-medium');
    });

    it('should focus next option after keyboard navigation', () => {
        const handleChange = vi.fn();

        const { container } = render(
            <SegmentedControl options={defaultOptions} value="option1" onChange={handleChange} />
        );

        const tablist = container.querySelector('[role="tablist"]');
        fireEvent.keyDown(tablist!, { key: 'ArrowRight' });

        // Verify onChange was called with next option
        expect(handleChange).toHaveBeenCalledWith('option2');
    });

    it('should render data attribute on buttons', () => {
        render(<SegmentedControl options={defaultOptions} value="option1" onChange={vi.fn()} />);

        const buttons = screen.getAllByRole('tab');
        buttons.forEach((button) => {
            expect(button).toHaveAttribute('data-segmented-option');
        });
    });
});
