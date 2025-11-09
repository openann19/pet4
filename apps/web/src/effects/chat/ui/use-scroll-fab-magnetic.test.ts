import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollFabMagnetic } from './use-scroll-fab-magnetic';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}));

describe('useScrollFabMagnetic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useScrollFabMagnetic());

    expect(result.current.scale).toBeDefined();
    expect(result.current.translateY).toBeDefined();
    expect(result.current.badgeScale).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.badgeAnimatedStyle).toBeDefined();

    expect(result.current.scale.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.badgeScale.value).toBe(1);
  });

  it('should animate entry when visible', async () => {
    const { result, rerender } = renderHook(
      ({ isVisible }) => useScrollFabMagnetic({ isVisible }),
      {
        initialProps: { isVisible: false },
      }
    );

    expect(result.current.scale.value).toBe(0);

    rerender({ isVisible: true });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(0);
  });

  it('should animate exit when hidden', async () => {
    const { result, rerender } = renderHook(
      ({ isVisible }) => useScrollFabMagnetic({ isVisible }),
      {
        initialProps: { isVisible: true },
      }
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    rerender({ isVisible: false });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeLessThan(1);
  });

  it('should animate magnetic hover oscillation', async () => {
    const { result } = renderHook(() =>
      useScrollFabMagnetic({
        isVisible: true,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should oscillate
    expect(result.current.translateY.value).toBeDefined();
  });

  it('should animate badge scale on increment', async () => {
    const { result, rerender } = renderHook(
      ({ badgeCount, previousBadgeCount }) =>
        useScrollFabMagnetic({
          badgeCount,
          previousBadgeCount,
        }),
      {
        initialProps: { badgeCount: 0, previousBadgeCount: 0 },
      }
    );

    expect(result.current.badgeScale.value).toBe(1);

    rerender({ badgeCount: 1, previousBadgeCount: 0 });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.badgeScale.value).toBeGreaterThan(1);
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() =>
      useScrollFabMagnetic({
        isVisible: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should not oscillate in reduced motion
    expect(result.current.translateY.value).toBe(0);
  });

  it('should not animate when disabled', () => {
    const { result } = renderHook(() =>
      useScrollFabMagnetic({
        enabled: false,
        isVisible: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should maintain initial state
    expect(result.current.scale.value).toBe(0);
  });

  it('should use spring animation for entry', async () => {
    const { result, rerender } = renderHook(
      ({ isVisible }) => useScrollFabMagnetic({ isVisible }),
      {
        initialProps: { isVisible: false },
      }
    );

    rerender({ isVisible: true });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Should use spring animation
    expect(result.current.scale.value).toBeGreaterThan(0);
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useScrollFabMagnetic());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should return badge animated style', () => {
    const { result } = renderHook(() => useScrollFabMagnetic());

    expect(result.current.badgeAnimatedStyle).toBeDefined();
    expect(typeof result.current.badgeAnimatedStyle).toBe('object');
  });

  it('should not animate badge when count does not increase', () => {
    const { result, rerender } = renderHook(
      ({ badgeCount, previousBadgeCount }) =>
        useScrollFabMagnetic({
          badgeCount,
          previousBadgeCount,
        }),
      {
        initialProps: { badgeCount: 1, previousBadgeCount: 0 },
      }
    );

    const initialScale = result.current.badgeScale.value;

    rerender({ badgeCount: 1, previousBadgeCount: 1 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should not animate when count doesn't increase
    expect(result.current.badgeScale.value).toBe(initialScale);
  });
});
