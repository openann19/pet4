import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
    it('should render skeleton', () => {
        render(<Skeleton />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toBeInTheDocument();
    });

    it('should render as div with data-slot', () => {
        render(<Skeleton />);
        const skeleton = screen.getByRole('status');
        expect(skeleton.tagName).toBe('DIV');
        expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
    });

    it('should apply default styling', () => {
        render(<Skeleton />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveClass('bg-muted', 'rounded-md', 'animate-pulse');
    });

    it('should apply shimmer variant', () => {
        render(<Skeleton variant="shimmer" />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveClass('bg-muted', 'rounded-md');
        expect(skeleton).toHaveClass('relative', 'overflow-hidden');
        expect(skeleton).toHaveClass('before:absolute', 'before:inset-0', 'before:-translate-x-full', 'before:animate-shimmer');
    });

    it('should merge custom className', () => {
        render(<Skeleton className="custom-class" />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveClass('custom-class');
    });

    it('should have default accessibility attributes', () => {
        render(<Skeleton />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveAttribute('role', 'status');
        expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
        expect(skeleton).toHaveAttribute('aria-live', 'polite');
        expect(skeleton).toHaveAttribute('aria-atomic', 'true');
    });

    it('should render screen reader text', () => {
        render(<Skeleton />);
        const srText = screen.getByText('Loading...');
        expect(srText).toBeInTheDocument();
        expect(srText).toHaveClass('sr-only');
    });

    it('should accept custom HTML attributes', () => {
        render(<Skeleton data-custom="test" id="custom-skeleton" />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveAttribute('data-custom', 'test');
        expect(skeleton).toHaveAttribute('id', 'custom-skeleton');
    });

    it('should override default accessibility attributes when provided', () => {
        render(<Skeleton aria-label="Custom loading text" />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveAttribute('aria-label', 'Custom loading text');
    });

    it('should accept custom role', () => {
        render(<Skeleton role="progressbar" />);
        const skeleton = screen.getByRole('progressbar');
        expect(skeleton).toBeInTheDocument();
    });
});
