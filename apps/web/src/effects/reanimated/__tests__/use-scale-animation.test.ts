/**
 * Tests for useScaleAnimation hook
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScaleAnimation } from '../use-scale-animation';

vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn((initial: number) => ({
    value: initial,
    get: () => initial,
    set: vi.fn((val: number) => {
      (useSharedValue as ReturnType<typeof vi.fn>).mock.results[
        (useSharedValue as ReturnType<typeof vi.fn>).mock.results.length - 1
      ].value.value = val;
    }),
  })),
  useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => {
    try {
      return fn();
    } catch {
      return {};
    }
  }),
  withSpring: vi.fn((value: number) => value),
  withTiming: vi.fn((value: number) => value),
}));

vi.mock('../transitions', () => ({
  springConfigs: {
    smooth: { damping: 25, stiffness: 400 },
  },
  timingConfigs: {
    smooth: { duration: 300 },
  },
}));

describe('useScaleAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial scale of 1 when initial is true', () => {
    const { result } = renderHook(() => useScaleAnimation({ initial: true }));

    expect(result.current.scale.value).toBe(1);
    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.scaleIn).toBe('function');
    expect(typeof result.current.scaleOut).toBe('function');
    expect(typeof result.current.toggle).toBe('function');
  });

  it('should return initial scale when initial is false', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ initial: false, initialScale: 0.5 })
    );

    expect(result.current.scale.value).toBe(0.5);
  });

  it('should use custom initialScale', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ initial: false, initialScale: 0.8 })
    );

    expect(result.current.scale.value).toBe(0.8);
  });

  it('should scale in when scaleIn is called', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ initial: false, initialScale: 0.5 })
    );

    act(() => {
      result.current.scaleIn();
    });

    expect(result.current.scale.value).toBe(1);
  });

  it('should scale out when scaleOut is called', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ initial: true, initialScale: 0.5 })
    );

    act(() => {
      result.current.scaleOut();
    });

    expect(result.current.scale.value).toBe(0.5);
  });

  it('should toggle scale', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ initial: true, initialScale: 0.5 })
    );

    act(() => {
      result.current.toggle();
    });

    expect(result.current.scale.value).toBe(0.5);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.scale.value).toBe(1);
  });

  it('should not animate when enabled is false', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ enabled: false, initial: false, initialScale: 0.5 })
    );

    expect(result.current.scale.value).toBe(1);

    act(() => {
      result.current.scaleIn();
    });

    expect(result.current.scale.value).toBe(1);
  });

  it('should use spring animation when useSpring is true', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ useSpring: true, initial: false, initialScale: 0.5 })
    );

    act(() => {
      result.current.scaleIn();
    });

    expect(result.current.scale.value).toBe(1);
  });

  it('should use timing animation when useSpring is false', () => {
    const { result } = renderHook(() =>
      useScaleAnimation({ useSpring: false, initial: false, initialScale: 0.5 })
    );

    act(() => {
      result.current.scaleIn();
    });

    expect(result.current.scale.value).toBe(1);
  });

  it('should return animated style with transform', () => {
    const { result } = renderHook(() => useScaleAnimation());

    expect(result.current.animatedStyle).toHaveProperty('transform');
    expect(Array.isArray(result.current.animatedStyle.transform)).toBe(true);
  });
});

