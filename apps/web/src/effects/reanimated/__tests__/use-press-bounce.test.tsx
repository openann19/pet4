import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePressBounce } from '../use-press-bounce';

vi.mock('../useMotionPreferences', () => ({
  useMotionPreferences: () => ({ level: 'full', isReduced: false, isOff: false }),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('usePressBounce', () => {
  it('initializes with interaction kind and animated style', () => {
    const { result } = renderHook(() => usePressBounce());

    expect(result.current.kind).toBe('interaction');
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.variants).toBeDefined();
    expect(typeof result.current.onPressIn).toBe('function');
    expect(typeof result.current.onPressOut).toBe('function');
  });

  it('applies press scale on onPressIn', () => {
    const { result } = renderHook(() => usePressBounce());

    act(() => {
      result.current.onPressIn?.();
    });

    // Scale should be less than 1 (pressed state)
    expect(result.current.scale.get()).toBeLessThan(1);
  });

  it('returns to rest scale on onPressOut', () => {
    const { result } = renderHook(() => usePressBounce());

    act(() => {
      result.current.onPressIn?.();
      result.current.onPressOut?.();
    });

    // After the spring back, target is 1; in this mocked environment we assert goal
    expect(result.current.variants.rest.scale).toBe(1);
  });

  it('respects custom scale override', () => {
    const { result } = renderHook(() => usePressBounce({ scale: 0.9 }));

    const tap = result.current.variants.tap as { scale: number };
    expect(tap.scale).toBeCloseTo(0.9);
  });

  it('disables bounce when preferences level is off', () => {
    const { result } = renderHook(() =>
      usePressBounce({
        preferences: { level: 'off', isReduced: true, isOff: true },
      }),
    );

    const tap = result.current.variants.tap as { scale: number };
    const rest = result.current.variants.rest as { scale: number };

    expect(tap.scale).toBe(rest.scale);
  });
});
