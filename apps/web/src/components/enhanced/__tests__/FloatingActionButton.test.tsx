/**
 * FloatingActionButton Component Tests
 * Location: apps/web/src/components/enhanced/__tests__/FloatingActionButton.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingActionButton } from '../FloatingActionButton';

// Mock useReducedMotion
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock haptics
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

// Mock AnimatedView
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({
    children,
    className,
    style,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    style?: unknown;
    [key: string]: unknown;
  }) => (
    <div className={className} style={style as React.CSSProperties} {...props}>
      {children}
    </div>
  ),
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

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => fn()),
  withSpring: vi.fn((value: number) => value),
  withTiming: vi.fn((value: number) => value),
  withRepeat: vi.fn((anim: number) => anim),
  withSequence: vi.fn((...anims: number[]) => anims[0]),
  withDelay: vi.fn((delay: number, anim: number) => anim),
  Easing: {
    linear: (t: number) => t,
  },
}));

describe('FloatingActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default icon', () => {
    render(<FloatingActionButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render with custom icon', () => {
    render(<FloatingActionButton icon={<span data-testid="custom-icon">Custom</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<FloatingActionButton onClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render label when expanded', () => {
    render(<FloatingActionButton expanded label="Add Item" />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('should not render label when not expanded', () => {
    render(<FloatingActionButton label="Add Item" />);
    expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<FloatingActionButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should have correct default classes', () => {
    render(<FloatingActionButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed', 'bottom-24', 'right-6', 'z-50');
  });
});
