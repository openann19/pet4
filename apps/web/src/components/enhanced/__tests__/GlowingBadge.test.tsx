import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlowingBadge } from '../GlowingBadge';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('GlowingBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render badge with children', () => {
    render(<GlowingBadge>Test Badge</GlowingBadge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    render(<GlowingBadge>Default</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary/10');
  });

  it('should render with primary variant', () => {
    render(<GlowingBadge variant="primary">Primary</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-primary/10', 'text-primary', 'border-primary/20');
  });

  it('should render with secondary variant', () => {
    render(<GlowingBadge variant="secondary">Secondary</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-secondary/10', 'text-secondary', 'border-secondary/20');
  });

  it('should render with accent variant', () => {
    render(<GlowingBadge variant="accent">Accent</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-accent/10', 'text-accent', 'border-accent/20');
  });

  it('should render with success variant', () => {
    render(<GlowingBadge variant="success">Success</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-green-500/10', 'text-green-600', 'border-green-500/20');
  });

  it('should render with warning variant', () => {
    render(<GlowingBadge variant="warning">Warning</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-yellow-500/10', 'text-yellow-600', 'border-yellow-500/20');
  });

  it('should render pulse indicator when pulse is enabled', () => {
    render(<GlowingBadge pulse>Pulsing</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full');
    expect(pulseIndicator).toBeInTheDocument();
  });

  it('should not render pulse indicator when pulse is disabled', () => {
    render(<GlowingBadge pulse={false}>Not Pulsing</GlowingBadge>);
    const badge = screen.getByRole('status');
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full');
    expect(pulseIndicator).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<GlowingBadge className="custom-class">Custom</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(<GlowingBadge aria-label="Status badge">Status</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Status badge');
  });

  it('should have status role by default', () => {
    render(<GlowingBadge>Status</GlowingBadge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with glow enabled by default', () => {
    render(<GlowingBadge>Glowing</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should render with glow disabled', () => {
    render(<GlowingBadge glow={false}>Not Glowing</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should render with multiple children', () => {
    render(
      <GlowingBadge>
        <span>First</span>
        <span>Second</span>
      </GlowingBadge>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should render with complex children', () => {
    render(
      <GlowingBadge>
        <span>Count:</span>
        <strong>42</strong>
      </GlowingBadge>
    );
    expect(screen.getByText('Count:')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should have proper base classes', () => {
    render(<GlowingBadge>Base</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'gap-1',
      'px-3',
      'py-1',
      'rounded-full',
      'text-xs',
      'font-semibold',
      'border',
      'backdrop-blur-sm'
    );
  });

  it('should handle all variant types', () => {
    const variants: ('primary' | 'secondary' | 'accent' | 'success' | 'warning')[] = [
      'primary',
      'secondary',
      'accent',
      'success',
      'warning',
    ];

    variants.forEach((variant) => {
      const { unmount } = render(<GlowingBadge variant={variant}>{variant}</GlowingBadge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      unmount();
    });
  });

  it('should combine variant and custom classes', () => {
    render(
      <GlowingBadge variant="success" className="mt-4 mb-2">
        Combined
      </GlowingBadge>
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-green-500/10');
    expect(badge).toHaveClass('mt-4', 'mb-2');
  });

  it('should render pulse indicator with proper classes', () => {
    render(<GlowingBadge pulse>With Pulse</GlowingBadge>);
    const badge = screen.getByRole('status');
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full.bg-current');
    expect(pulseIndicator).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(<GlowingBadge>{null}</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should handle string children', () => {
    render(<GlowingBadge>String Content</GlowingBadge>);
    expect(screen.getByText('String Content')).toBeInTheDocument();
  });

  it('should handle number children', () => {
    render(<GlowingBadge>{42}</GlowingBadge>);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should be accessible with screen readers', () => {
    render(<GlowingBadge aria-label="Notification badge">New</GlowingBadge>);
    const badge = screen.getByRole('status', { name: 'Notification badge' });
    expect(badge).toBeInTheDocument();
  });

  it('should handle pulse and glow together', () => {
    render(
      <GlowingBadge pulse glow>
        Pulsing and Glowing
      </GlowingBadge>
    );
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full');
    expect(pulseIndicator).toBeInTheDocument();
  });

  it('should handle pulse without glow', () => {
    render(
      <GlowingBadge pulse glow={false}>
        Pulsing Only
      </GlowingBadge>
    );
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full');
    expect(pulseIndicator).toBeInTheDocument();
  });
});
