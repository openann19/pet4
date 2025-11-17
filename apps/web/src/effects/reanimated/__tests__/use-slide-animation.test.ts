/**
 * Tests for useSlideAnimation hook
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlideAnimation, type SlideDirection } from '../use-slide-animation';

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

describe('useSlideAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial position of 0,0 when initial is true', () => {
    const { result } = renderHook(() => useSlideAnimation({ initial: true }));

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.slideIn).toBe('function');
    expect(typeof result.current.slideOut).toBe('function');
    expect(typeof result.current.toggle).toBe('function');
  });

  it('should slide up when direction is up and initial is false', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'up', initial: false, distance: 40 })
    );

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(-40);
  });

  it('should slide down when direction is down and initial is false', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'down', initial: false, distance: 40 })
    );

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(40);
  });

  it('should slide left when direction is left and initial is false', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'left', initial: false, distance: 40 })
    );

    expect(result.current.translateX.value).toBe(-40);
    expect(result.current.translateY.value).toBe(0);
  });

  it('should slide right when direction is right and initial is false', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'right', initial: false, distance: 40 })
    );

    expect(result.current.translateX.value).toBe(40);
    expect(result.current.translateY.value).toBe(0);
  });

  it('should slide in to position 0,0', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'up', initial: false, distance: 40 })
    );

    act(() => {
      result.current.slideIn();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
  });

  it('should slide out in correct direction', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'up', initial: true, distance: 40 })
    );

    act(() => {
      result.current.slideOut();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(-40);
  });

  it('should toggle slide animation', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'up', initial: true, distance: 40 })
    );

    act(() => {
      result.current.toggle();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(-40);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
  });

  it('should not animate when enabled is false', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ enabled: false, initial: false, distance: 40 })
    );

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);

    act(() => {
      result.current.slideOut();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
  });

  it('should use custom distance', () => {
    const { result } = renderHook(() =>
      useSlideAnimation({ direction: 'up', initial: false, distance: 100 })
    );

    expect(result.current.translateY.value).toBe(-100);
  });

  it('should return animated style with transform', () => {
    const { result } = renderHook(() => useSlideAnimation());

    expect(result.current.animatedStyle).toHaveProperty('transform');
    expect(Array.isArray(result.current.animatedStyle.transform)).toBe(true);
  });
});
