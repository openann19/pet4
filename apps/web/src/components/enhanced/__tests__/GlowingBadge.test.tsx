import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { GlowingBadge } from '@/components/enhanced/GlowingBadge';
import { renderWithUI } from '@/test/utils/test-helpers';

describe('GlowingBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should render badge with children', () => {
    renderWithUI(<GlowingBadge>Test Badge</GlowingBadge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    renderWithUI(<GlowingBadge>Default</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary/10');
  });

  it('should render with primary variant', () => {
    renderWithUI(<GlowingBadge variant="primary">Primary</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-primary/10', 'text-primary', 'border-primary/20');
  });

  it('should render with secondary variant', () => {
    renderWithUI(<GlowingBadge variant="secondary">Secondary</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-secondary/10', 'text-secondary', 'border-secondary/20');
  });

  it('should render with accent variant', () => {
    renderWithUI(<GlowingBadge variant="accent">Accent</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-accent/10', 'text-accent', 'border-accent/20');
  });

  it('should render with success variant', () => {
    renderWithUI(<GlowingBadge variant="success">Success</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-green-500/10', 'text-green-600', 'border-green-500/20');
  });

  it('should render with warning variant', () => {
    renderWithUI(<GlowingBadge variant="warning">Warning</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-yellow-500/10', 'text-yellow-600', 'border-yellow-500/20');
  });

  it('should render pulse indicator when pulse is enabled', () => {
    renderWithUI(<GlowingBadge pulse>Pulsing</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full');
    expect(pulseIndicator).toBeInTheDocument();
  });

  it('should not render pulse indicator when pulse is disabled', () => {
    renderWithUI(<GlowingBadge pulse={false}>Not Pulsing</GlowingBadge>);
    const badge = screen.getByRole('status');
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full');
    expect(pulseIndicator).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    renderWithUI(<GlowingBadge className="custom-class">Custom</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    renderWithUI(<GlowingBadge aria-label="Status badge">Status</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Status badge');
  });

  it('should have status role by default', () => {
    renderWithUI(<GlowingBadge>Status</GlowingBadge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with glow enabled by default', () => {
    renderWithUI(<GlowingBadge>Glowing</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should render with glow disabled', () => {
    renderWithUI(<GlowingBadge glow={false}>Not Glowing</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should render with multiple children', () => {
    renderWithUI(
      <GlowingBadge>
        <span>First</span>
        <span>Second</span>
      </GlowingBadge>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should render with complex children', () => {
    renderWithUI(
      <GlowingBadge>
        <span>Count:</span>
        <strong>42</strong>
      </GlowingBadge>
    );
    expect(screen.getByText('Count:')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should have proper base classes', () => {
    renderWithUI(<GlowingBadge>Base</GlowingBadge>);
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
      const { unmount } = renderWithUI(<GlowingBadge variant={variant}>{variant}</GlowingBadge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      unmount();
    });
  });

  it('should combine variant and custom classes', () => {
    renderWithUI(
      <GlowingBadge variant="success" className="mt-4 mb-2">
        Combined
      </GlowingBadge>
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-green-500/10');
    expect(badge).toHaveClass('mt-4', 'mb-2');
  });

  it('should render pulse indicator with proper classes', () => {
    renderWithUI(<GlowingBadge pulse>With Pulse</GlowingBadge>);
    const badge = screen.getByRole('status');
    const pulseIndicator = badge.querySelector('.w-2.h-2.rounded-full.bg-current');
    expect(pulseIndicator).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    renderWithUI(<GlowingBadge>{null}</GlowingBadge>);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should handle string children', () => {
    renderWithUI(<GlowingBadge>String Content</GlowingBadge>);
    expect(screen.getByText('String Content')).toBeInTheDocument();
  });

  it('should handle number children', () => {
    renderWithUI(<GlowingBadge>{42}</GlowingBadge>);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should be accessible with screen readers', () => {
    renderWithUI(<GlowingBadge aria-label="Notification badge">New</GlowingBadge>);
    const badge = screen.getByRole('status', { name: 'Notification badge' });
    expect(badge).toBeInTheDocument();
  });

  it('should handle pulse and glow together', () => {
    renderWithUI(
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
    renderWithUI(
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
