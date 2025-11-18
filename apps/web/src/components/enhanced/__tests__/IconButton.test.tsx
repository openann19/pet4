import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from '@/components/enhanced/buttons/IconButton';

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    scale: { value: 1 },
    translateY: { value: 0 },
    handleEnter: vi.fn(),
    handleLeave: vi.fn(),
    animatedStyle: {},
  })),
}));
vi.mock('@/effects/reanimated/use-ripple-effect', () => ({
  useRippleEffect: vi.fn(() => ({
    ripples: [],
    addRipple: vi.fn(),
    animatedStyle: {},
    color: 'rgba(255, 255, 255, 0.5)',
  })),
}));
vi.mock('@/effects/reanimated/use-magnetic-hover', () => ({
  useMagneticHover: vi.fn(() => ({
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
  })),
}));
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAnimatedStyleValue: vi.fn((style: unknown) => {
    if (typeof style === 'function') {
      try {
        return style();
      } catch {
        return {};
      }
    }
    return style || {};
  }),
}));
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((value) => value),
  withTiming: vi.fn((value) => value),
  withSequence: vi.fn((...values) => values[values.length - 1]),
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

describe('IconButton', () => {
  const mockIcon = <span data-testid="icon">Icon</span>;
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders icon button', () => {
    render(<IconButton icon={mockIcon} aria-label="Test Button" />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<IconButton icon={mockIcon} aria-label="Test Button" onClick={() => void mockOnClick()} />);

    const button = screen.getByRole('button', { name: /test button/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies medium size by default', () => {
    const { container } = render(<IconButton icon={mockIcon} aria-label="Test Button" />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies small size', () => {
    const { container } = render(<IconButton icon={mockIcon} size="sm" aria-label="Test Button" />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies large size', () => {
    const { container } = render(<IconButton icon={mockIcon} size="lg" aria-label="Test Button" />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    const { container } = render(<IconButton icon={mockIcon} aria-label="Test Button" />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies ghost variant', () => {
    const { container } = render(
      <IconButton icon={mockIcon} variant="ghost" aria-label="Test Button" />
    );

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies outline variant', () => {
    const { container } = render(
      <IconButton icon={mockIcon} variant="outline" aria-label="Test Button" />
    );

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies glass variant', () => {
    const { container } = render(
      <IconButton icon={mockIcon} variant="glass" aria-label="Test Button" />
    );

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('enables ripple effect by default', () => {
    render(<IconButton icon={mockIcon} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('disables ripple effect when enableRipple is false', () => {
    render(<IconButton icon={mockIcon} enableRipple={false} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('enables magnetic hover by default', () => {
    render(<IconButton icon={mockIcon} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('disables magnetic hover when enableMagnetic is false', () => {
    render(<IconButton icon={mockIcon} enableMagnetic={false} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('disables glow by default', () => {
    render(<IconButton icon={mockIcon} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('enables glow when enableGlow is true', () => {
    render(<IconButton icon={mockIcon} enableGlow={true} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<IconButton icon={mockIcon} disabled={true} aria-label="Test Button" />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <IconButton icon={mockIcon} className="custom-class" aria-label="Test Button" />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('requires aria-label', () => {
    render(<IconButton icon={mockIcon} aria-label="Accessible Button" />);

    const button = screen.getByRole('button', { name: /accessible button/i });
    expect(button).toBeInTheDocument();
  });
});
