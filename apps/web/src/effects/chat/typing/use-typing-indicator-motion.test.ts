import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTypingIndicatorMotion } from './use-typing-indicator-motion';
import { motionTheme } from '@/config/motionTheme';

// Comprehensive inline mock for the entire @petspark/motion package
vi.mock('@petspark/motion', () => {
  const mockFn = (name: string) => vi.fn().mockName(`[mock]${name}`);
  return {
    Easing: {
      inOut: (easing: any) => easing,
      out: (easing: any) => easing,
      ease: (t: number) => t,
      poly: (n: number) => (t: number) => t ** n,
      linear: (t: number) => t,
      quad: (t: number) => t * t,
      cubic: (t: number) => t * t * t,
      sin: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
      circle: (t: number) => 1 - Math.sqrt(1 - t * t),
      exp: (t: number) => Math.pow(2, 10 * (t - 1)),
      in: (easing: (t: number) => number) => easing,
    },
    useSharedValue: (initialValue: any) => ({ value: initialValue }),
    withTiming: (toValue: any) => toValue,
    withRepeat: (animation: any) => animation,
    withSequence: (...animations: any[]) => animations[0],
    withDelay: (_delay: number, animation: any) => animation,
    useAnimatedStyle: (factory: () => any) => factory(),
    // Add any other exports that might be used transitively
    interpolate: mockFn('interpolate'),
    MotionView: 'div',
  };
});

const mockUseMotionPreferences = vi.fn();

vi.mock('@/effects/reanimated/useMotionPreferences', () => ({
  useMotionPreferences: () => mockUseMotionPreferences(),
}));

describe('useTypingIndicatorMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseMotionPreferences.mockReturnValue({
      level: 'full',
      isReduced: false,
      isOff: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns presence motion data when typing', () => {
    const { result } = renderHook(() => useTypingIndicatorMotion({ isTyping: true }));

    expect(result.current.kind).toBe('presence');
    expect(result.current.isVisible).toBe(true);
    expect(result.current.displayMode).toBe('dots');
    expect(result.current.dots).toHaveLength(3);
  });

  it('hides after typing stops once delay passes', () => {
    const { result, rerender } = renderHook(
      ({ isTyping }: { isTyping: boolean }) => useTypingIndicatorMotion({ isTyping }),
      { initialProps: { isTyping: true } }
    );

    expect(result.current.isVisible).toBe(true);

    rerender({ isTyping: false });
    // It should still be visible immediately after typing stops
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(motionTheme.durations.fast + 5);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('returns text display mode when motion is reduced', () => {
    mockUseMotionPreferences.mockReturnValueOnce({
      level: 'reduced',
      isReduced: true,
      isOff: false,
    });

    const { result } = renderHook(() => useTypingIndicatorMotion({ isTyping: true }));
    expect(result.current.displayMode).toBe('text');
    expect(result.current.label).toBe('Typing…');
  });

  it('can keep static dots when reduced mode requests it', () => {
    mockUseMotionPreferences.mockReturnValueOnce({
      level: 'reduced',
      isReduced: true,
      isOff: false,
    });

    const { result } = renderHook(() =>
      useTypingIndicatorMotion({ isTyping: true, reducedMode: 'static-dots' })
    );

    expect(result.current.displayMode).toBe('static-dots');
  });

  it('respects custom label', () => {
    const { result } = renderHook(() =>
      useTypingIndicatorMotion({ isTyping: true, label: 'Pet parent is typing…' })
    );

    expect(result.current.label).toBe('Pet parent is typing…');
  });

  it('forces text display when motion preferences are off', () => {
    mockUseMotionPreferences.mockReturnValueOnce({
      level: 'off',
      isReduced: true,
      isOff: true,
    });

    const { result } = renderHook(() => useTypingIndicatorMotion({ isTyping: true }));

    expect(result.current.displayMode).toBe('text');
    expect(result.current.isVisible).toBe(true);
  });
});
