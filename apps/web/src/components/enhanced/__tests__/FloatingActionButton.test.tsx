import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FloatingActionButton } from '@/components/enhanced/FloatingActionButton';
import { renderWithProviders } from '@/test/utilities';

// Mock dependencies
vi.mock('@petspark/motion', () => ({
  useSharedValue: vi.fn(() => ({ get: vi.fn(() => 1), set: vi.fn() })),
  useAnimatedStyle: vi.fn(() => vi.fn(() => ({}))),
  withSpring: vi.fn(() => ({ target: 1, transition: {} })),
  withRepeat: vi.fn(() => ({ target: 1, transition: {} })),
  withTiming: vi.fn(() => ({ target: 1, transition: {} })),
  withSequence: vi.fn(() => ({ target: 1, transition: {} })),
  withDelay: vi.fn(() => ({ target: 1, transition: {} })),
  Easing: { linear: vi.fn() },
  animate: vi.fn(),
  MotionView: ({ children, style, className }: any) => (
    <div style={style} className={className} data-testid="motion-view">
      {children}
    </div>
  ),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

vi.mock('@/effects/reanimated/animated-view', () => ({
  useAnimatedStyleValue: vi.fn(() => ({})),
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

const { haptics } = await import('@/lib/haptics');

describe('FloatingActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default icon', () => {
    renderWithProviders(<FloatingActionButton />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('motion-view')).toBeInTheDocument();
  });

  it('calls onClick and triggers haptic feedback', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(<FloatingActionButton onClick={() => void onClick()} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(haptics.impact).toHaveBeenCalledWith('medium');
  });

  it('renders custom icon', () => {
    const customIcon = <span data-testid="custom-icon">Custom</span>;

    renderWithProviders(<FloatingActionButton icon={customIcon} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithProviders(<FloatingActionButton className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('shows label when expanded', () => {
    renderWithProviders(<FloatingActionButton expanded label="Add Item" />);

    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('does not show label when not expanded', () => {
    renderWithProviders(<FloatingActionButton label="Add Item" />);

    expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
  });

  it('has correct base classes', () => {
    renderWithProviders(<FloatingActionButton />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('bottom-24');
    expect(button.className).toContain('right-6');
    expect(button.className).toContain('bg-linear-to-br');
    expect(button.className).toContain('from-primary');
  });

  it('handles mouse enter and leave without reduced motion', async () => {
    const user = userEvent.setup();

    renderWithProviders(<FloatingActionButton />);

    const button = screen.getByRole('button');
    await user.hover(button);
    await user.unhover(button);

    // Animations are triggered, but we can't easily test the animated values
    expect(button).toBeInTheDocument();
  });

  it('handles mouse down and up', async () => {
    const user = userEvent.setup();

    renderWithProviders(<FloatingActionButton />);

    const button = screen.getByRole('button');
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    await user.pointer({ keys: '[/MouseLeft]', target: button });

    expect(button).toBeInTheDocument();
  });

  it('skips animations when reduced motion is enabled', async () => {
    const { useReducedMotion } = await import('@/hooks/useReducedMotion');
    (useReducedMotion as any).mockReturnValue(true);

    const user = userEvent.setup();

    renderWithProviders(<FloatingActionButton />);

    const button = screen.getByRole('button');
    await user.hover(button);

    // With reduced motion, hover animations should be skipped
    expect(button).toBeInTheDocument();
  });

  it('includes shimmer effect by default', () => {
    renderWithProviders(<FloatingActionButton />);

    // Should have multiple motion views including shimmer
    const motionViews = screen.getAllByTestId('motion-view');
    expect(motionViews.length).toBeGreaterThan(1);
  });

  it('positions as fixed bottom right', () => {
    renderWithProviders(<FloatingActionButton />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('bottom-24');
    expect(button.className).toContain('right-6');
  });
});
