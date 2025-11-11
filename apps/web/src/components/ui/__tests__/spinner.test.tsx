/**
 * Spinner Component Tests
 * Location: apps/web/src/components/ui/__tests__/spinner.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../spinner';
import * as useReducedMotionHook from '@/hooks/useReducedMotion';

// Mock the useReducedMotion hook
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
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
  useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => {
    const result = fn();
    return result;
  }),
  withRepeat: vi.fn((anim: number) => anim),
  withTiming: vi.fn((value: number) => value),
  Easing: {
    linear: (t: number) => t,
    inOut: (easing: (t: number) => number) => easing,
    ease: (t: number) => t,
  },
}));

describe('Spinner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render with default props', () => {
    render(<Spinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('should render with small size', () => {
    render(<Spinner size="sm" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with medium size (default)', () => {
    render(<Spinner size="md" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<Spinner size="lg" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    render(<Spinner variant="default" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with subtle variant', () => {
    render(<Spinner variant="subtle" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with premium variant', () => {
    render(<Spinner variant="premium" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Spinner className="custom-class" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('should pass through additional props', () => {
    render(<Spinner data-testid="custom-spinner" />);

    const spinner = screen.getByTestId('custom-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should have accessible loading text', () => {
    render(<Spinner />);

    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toHaveClass('sr-only');
  });

  it('should respect reduced motion preference', () => {
    vi.spyOn(useReducedMotionHook, 'useReducedMotion').mockReturnValue(true);

    render(<Spinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle all size and variant combinations', () => {
    const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];
    const variants: ('default' | 'subtle' | 'premium')[] = ['default', 'subtle', 'premium'];

    sizes.forEach((size) => {
      variants.forEach((variant) => {
        const { unmount } = render(<Spinner size={size} variant={variant} />);
        const spinner = screen.getByRole('status');
        expect(spinner).toBeInTheDocument();
        unmount();
      });
    });
  });
});
