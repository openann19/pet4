import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { Separator } from '../separator';

describe('Separator', () => {
    it('should render separator', () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toBeInTheDocument();
    });

    it('should render as Radix UI separator root', () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveAttribute('data-slot', 'separator-root');
    });

    it('should apply default styling', () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveClass('bg-border', 'shrink-0');
    });

    it('should apply horizontal orientation by default', () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveAttribute('data-orientation', 'horizontal');
        expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('should apply horizontal styling', () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveClass('data-[orientation=horizontal]:h-px', 'data-[orientation=horizontal]:w-full');
    });

    it('should apply vertical orientation', () => {
        const { container } = render(<Separator orientation="vertical" />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveAttribute('data-orientation', 'vertical');
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('should apply vertical styling', () => {
        const { container } = render(<Separator orientation="vertical" />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveClass('data-[orientation=vertical]:h-full', 'data-[orientation=vertical]:w-px');
    });

    it('should merge custom className', () => {
        const { container } = render(<Separator className="custom-class" />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveClass('custom-class');
    });

    it('should have decorative role by default', () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveAttribute('aria-hidden', 'true');
        expect(separator).toHaveAttribute('role', 'none');
    });

    it('should accept decorative prop', () => {
        render(<Separator decorative={false} />);
        const separator = screen.getByRole('separator');
        expect(separator).toBeInTheDocument();
        expect(separator).not.toHaveAttribute('aria-hidden');
    });

    it('should accept custom HTML attributes', () => {
        const { container } = render(<Separator data-testid="custom-separator" />);
        const separator = container.querySelector('[data-slot="separator-root"]');
        expect(separator).toHaveAttribute('data-testid', 'custom-separator');
    });

    it('should have proper accessibility attributes when not decorative', () => {
        render(<Separator orientation="vertical" decorative={false} />);
        const separator = screen.getByRole('separator');
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        expect(separator).not.toHaveAttribute('aria-hidden');
    });
});
