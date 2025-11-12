import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumButton } from '@/components/enhanced/PremiumButton';

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    scale: { value: 1 },
    translateY: { value: 0 },
    handleEnter: vi.fn(),
    handleLeave: vi.fn(),
    animatedStyle: {},
  })),
}));
vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
  useBounceOnTap: vi.fn(() => ({
    scale: { value: 1 },
    handlePress: vi.fn(),
  })),
}));
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAnimatedStyleValue: vi.fn((style) => style),
}));
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((value) => value),
  withRepeat: vi.fn((value) => value),
}));
vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(() => undefined),
    trigger: vi.fn(() => undefined),
    light: vi.fn(() => undefined),
    medium: vi.fn(() => undefined),
    heavy: vi.fn(() => undefined),
    selection: vi.fn(() => undefined),
    success: vi.fn(() => undefined),
    warning: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    notification: vi.fn(() => undefined),
    isHapticSupported: vi.fn(() => false),
  },
  triggerHaptic: vi.fn(() => undefined),
}));

describe('PremiumButton', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with children', () => {
    render(<PremiumButton onClick={mockOnClick}>Click Me</PremiumButton>);

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<PremiumButton onClick={mockOnClick}>Click Me</PremiumButton>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant by default', () => {
    const { container } = render(<PremiumButton>Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--btn-primary-bg)]');
  });

  it('applies secondary variant', () => {
    const { container } = render(<PremiumButton variant="secondary">Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--btn-secondary-bg)]');
  });

  it('applies gradient variant', () => {
    const { container } = render(<PremiumButton variant="gradient">Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('applies medium size by default', () => {
    const { container } = render(<PremiumButton>Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('px-4', 'py-2');
  });

  it('applies small size', () => {
    const { container } = render(<PremiumButton size="sm">Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('px-3', 'py-1.5');
  });

  it('applies large size', () => {
    const { container } = render(<PremiumButton size="lg">Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('px-6', 'py-3');
  });

  it('displays icon on left by default', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<PremiumButton icon={icon}>Click Me</PremiumButton>);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('displays icon on right', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(
      <PremiumButton icon={icon} iconPosition="right">
        Click Me
      </PremiumButton>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PremiumButton loading={true}>Click Me</PremiumButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    render(<PremiumButton disabled={true}>Click Me</PremiumButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<PremiumButton className="custom-class">Click Me</PremiumButton>);

    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    render(<PremiumButton data-testid="custom-button">Click Me</PremiumButton>);

    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });
});
