import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../toggle';

describe('Toggle', () => {
    const defaultProps = {
        children: 'Toggle',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('should render toggle', () => {
            render(<Toggle {...defaultProps} />);
            const toggle = screen.getByRole('button');
            expect(toggle).toBeInTheDocument();
        });

        it('should render with data-slot attribute', () => {
            render(<Toggle {...defaultProps} />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveAttribute('data-slot', 'toggle');
        });

        it('should render children', () => {
            render(<Toggle {...defaultProps} />);
            expect(screen.getByText('Toggle')).toBeInTheDocument();
        });

        it('should merge custom className', () => {
            render(<Toggle {...defaultProps} className="custom-class" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('custom-class');
        });
    });

    describe('Variants', () => {
        it('should apply default variant', () => {
            render(<Toggle {...defaultProps} variant="default" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('bg-transparent');
        });

        it('should apply outline variant', () => {
            render(<Toggle {...defaultProps} variant="outline" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('border', 'border-input', 'bg-transparent', 'shadow-xs');
        });
    });

    describe('Sizes', () => {
        it('should apply default size', () => {
            render(<Toggle {...defaultProps} size="default" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('h-9', 'px-2', 'min-w-9');
        });

        it('should apply small size', () => {
            render(<Toggle {...defaultProps} size="sm" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('h-8', 'px-1.5', 'min-w-8');
        });

        it('should apply large size', () => {
            render(<Toggle {...defaultProps} size="lg" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('h-10', 'px-2.5', 'min-w-10');
        });
    });

    describe('Toggle States', () => {
        it('should toggle between on and off states', async () => {
            const user = userEvent.setup();
            render(<Toggle {...defaultProps} />);

            const toggle = screen.getByRole('button');
            expect(toggle).not.toHaveAttribute('data-state', 'on');

            await user.click(toggle);
            expect(toggle).toHaveAttribute('data-state', 'on');

            await user.click(toggle);
            expect(toggle).not.toHaveAttribute('data-state', 'on');
        });

        it('should apply on state styling', async () => {
            const user = userEvent.setup();
            render(<Toggle {...defaultProps} />);

            const toggle = screen.getByRole('button');
            await user.click(toggle);

            expect(toggle).toHaveClass('data-[state=on]:bg-accent', 'data-[state=on]:text-accent-foreground');
        });

        it('should handle pressed prop', () => {
            render(<Toggle {...defaultProps} pressed />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveAttribute('data-state', 'on');
        });

        it('should handle defaultPressed prop', () => {
            render(<Toggle {...defaultProps} defaultPressed />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveAttribute('data-state', 'on');
        });
    });

    describe('Events', () => {
        it('should call onPressedChange when toggled', async () => {
            const user = userEvent.setup();
            const onPressedChange = vi.fn();

            render(<Toggle {...defaultProps} onPressedChange={onPressedChange} />);

            const toggle = screen.getByRole('button');
            await user.click(toggle);

            expect(onPressedChange).toHaveBeenCalledWith(true);
        });

        it('should call onClick when clicked', async () => {
            const user = userEvent.setup();
            const onClick = vi.fn();

            render(<Toggle {...defaultProps} onClick={onClick} />);

            const toggle = screen.getByRole('button');
            await user.click(toggle);

            expect(onClick).toHaveBeenCalled();
        });
    });

    describe('Disabled State', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Toggle {...defaultProps} disabled />);
            const toggle = screen.getByRole('button');
            expect(toggle).toBeDisabled();
            expect(toggle).toHaveAttribute('disabled');
        });

        it('should apply disabled styling', () => {
            render(<Toggle {...defaultProps} disabled />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
        });

        it('should not toggle when disabled', async () => {
            const user = userEvent.setup();
            render(<Toggle {...defaultProps} disabled />);

            const toggle = screen.getByRole('button');
            await user.click(toggle);

            expect(toggle).not.toHaveAttribute('data-state', 'on');
        });
    });

    describe('Accessibility', () => {
        it('should have proper button role', () => {
            render(<Toggle {...defaultProps} />);
            const toggle = screen.getByRole('button');
            expect(toggle).toBeInTheDocument();
        });

        it('should support aria-label', () => {
            render(<Toggle aria-label="Custom toggle" />);
            const toggle = screen.getByRole('button', { name: 'Custom toggle' });
            expect(toggle).toBeInTheDocument();
        });

        it('should support aria-invalid', () => {
            render(<Toggle {...defaultProps} aria-invalid="true" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveAttribute('aria-invalid', 'true');
            expect(toggle).toHaveClass('aria-invalid:ring-destructive/20');
        });
    });

    describe('HTML Attributes', () => {
        it('should accept custom HTML attributes', () => {
            render(<Toggle {...defaultProps} data-testid="custom-toggle" id="toggle-1" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveAttribute('data-testid', 'custom-toggle');
            expect(toggle).toHaveAttribute('id', 'toggle-1');
        });

        it('should accept form attributes', () => {
            render(<Toggle {...defaultProps} form="test-form" name="toggle-field" value="toggle-value" />);
            const toggle = screen.getByRole('button');
            expect(toggle).toHaveAttribute('form', 'test-form');
            expect(toggle).toHaveAttribute('name', 'toggle-field');
            expect(toggle).toHaveAttribute('value', 'toggle-value');
        });
    });

    describe('Icon Support', () => {
        it('should render with icon', () => {
            render(
                <Toggle>
                    <svg data-testid="test-icon" />
                    Toggle
                </Toggle>
            );

            expect(screen.getByTestId('test-icon')).toBeInTheDocument();
            expect(screen.getByText('Toggle')).toBeInTheDocument();
        });
    });

    describe('Keyboard Navigation', () => {
        it('should toggle on space key', async () => {
            const user = userEvent.setup();
            render(<Toggle {...defaultProps} />);

            const toggle = screen.getByRole('button');
            toggle.focus();
            await user.keyboard('{ }');

            expect(toggle).toHaveAttribute('data-state', 'on');
        });

        it('should toggle on enter key', async () => {
            const user = userEvent.setup();
            render(<Toggle {...defaultProps} />);

            const toggle = screen.getByRole('button');
            toggle.focus();
            await user.keyboard('{Enter}');

            expect(toggle).toHaveAttribute('data-state', 'on');
        });
    });
});
