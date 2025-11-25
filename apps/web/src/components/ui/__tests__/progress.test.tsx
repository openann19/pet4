import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('should render progress', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toBeInTheDocument();
        });

        it('should render with data-slot attribute', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('data-slot', 'progress');
        });

        it('should render progress indicator', () => {
            const { container } = render(<Progress value={50} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toBeInTheDocument();
        });
    });

    describe('Value Handling', () => {
        it('should render with specified value', () => {
            render(<Progress value={75} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '75');
        });

        it('should default to 0 when value is not provided', () => {
            render(<Progress />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '0');
        });

        it('should handle null value', () => {
            render(<Progress value={null} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '0');
        });

        it('should handle undefined value', () => {
            render(<Progress value={undefined} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '0');
        });

        it('should round decimal values', () => {
            render(<Progress value={75.7} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '76');
        });

        it('should handle 0 value', () => {
            render(<Progress value={0} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '0');
        });

        it('should handle 100 value', () => {
            render(<Progress value={100} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '100');
        });
    });

    describe('Styling and Classes', () => {
        it('should apply default styling', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveClass('bg-primary/20', 'relative', 'h-2', 'w-full', 'overflow-hidden', 'rounded-full', 'shadow-inner');
        });

        it('should merge custom className', () => {
            render(<Progress value={50} className="custom-class" />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveClass('custom-class');
        });

        it('should apply indicator styling', () => {
            const { container } = render(<Progress value={50} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveClass('bg-primary', 'h-full', 'w-full', 'flex-1', 'rounded-full', 'shadow-sm', 'transition-all', 'duration-500', 'ease-out');
        });
    });

    describe('Progress Indicator Transform', () => {
        it('should apply correct transform for 50% value', () => {
            const { container } = render(<Progress value={50} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveStyle('transform: translateX(-50%)');
        });

        it('should apply correct transform for 0% value', () => {
            const { container } = render(<Progress value={0} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveStyle('transform: translateX(-100%)');
        });

        it('should apply correct transform for 100% value', () => {
            const { container } = render(<Progress value={100} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveStyle('transform: translateX(-0%)');
        });

        it('should apply correct transform for 25% value', () => {
            const { container } = render(<Progress value={25} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveStyle('transform: translateX(-75%)');
        });

        it('should apply correct transform for 75% value', () => {
            const { container } = render(<Progress value={75} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveStyle('transform: translateX(-25%)');
        });
    });

    describe('Accessibility', () => {
        it('should have proper progressbar role', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toBeInTheDocument();
        });

        it('should have correct aria attributes', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuemin', '0');
            expect(progress).toHaveAttribute('aria-valuemax', '100');
            expect(progress).toHaveAttribute('aria-valuenow', '50');
        });

        it('should have default aria-label', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-label', 'Progress: 50%');
        });

        it('should use custom aria-label when provided', () => {
            render(<Progress value={50} aria-label="Custom progress label" />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-label', 'Custom progress label');
        });

        it('should hide indicator from screen readers', () => {
            const { container } = render(<Progress value={50} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('HTML Attributes', () => {
        it('should accept custom HTML attributes', () => {
            render(<Progress value={50} data-testid="custom-progress" id="progress-1" />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('data-testid', 'custom-progress');
            expect(progress).toHaveAttribute('id', 'progress-1');
        });

        it('should accept aria attributes', () => {
            render(<Progress value={50} aria-describedby="progress-desc" aria-labelledby="progress-label" />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-describedby', 'progress-desc');
            expect(progress).toHaveAttribute('aria-labelledby', 'progress-label');
        });

        it('should accept data attributes', () => {
            render(<Progress value={50} data-custom="test" data-value="50" />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('data-custom', 'test');
            expect(progress).toHaveAttribute('data-value', '50');
        });
    });

    describe('Edge Cases', () => {
        it('should handle negative values', () => {
            render(<Progress value={-10} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '-10');
        });

        it('should handle values above 100', () => {
            render(<Progress value={150} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '150');
        });

        it('should handle very small decimal values', () => {
            render(<Progress value={0.1} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '0');
        });

        it('should handle very large decimal values', () => {
            render(<Progress value={99.9} />);
            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '100');
        });
    });

    describe('Component Structure', () => {
        it('should render as div element', () => {
            render(<Progress value={50} />);
            const progress = screen.getByRole('progressbar');
            expect(progress.tagName).toBe('DIV');
        });

        it('should render indicator as div element', () => {
            const { container } = render(<Progress value={50} />);
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(indicator?.tagName).toBe('DIV');
        });

        it('should have proper parent-child relationship', () => {
            const { container } = render(<Progress value={50} />);
            const progress = container.querySelector('[data-slot="progress"]');
            const indicator = container.querySelector('[data-slot="progress-indicator"]');
            expect(progress).toContainElement(indicator!);
        });
    });
});
