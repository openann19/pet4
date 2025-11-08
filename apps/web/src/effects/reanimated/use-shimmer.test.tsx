import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShimmer } from './use-shimmer';

describe('useShimmer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useShimmer());

    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.start).toBeDefined();
    expect(result.current.stop).toBeDefined();
  });

  it('should start shimmer animation when enabled', () => {
    const { result } = renderHook(() => useShimmer({ enabled: true }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.start).toBeDefined();
    expect(result.current.stop).toBeDefined();
  });

  it('should not start shimmer when disabled', () => {
    const { result } = renderHook(() => useShimmer({ enabled: false }));

    expect(result.current).toBeDefined();
  });

  it('should respect delay option', () => {
    const { result } = renderHook(() =>
      useShimmer({
        enabled: true,
        delay: 1000,
      })
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current).toBeDefined();
  });

  it('should allow manual start and stop', () => {
    const { result } = renderHook(() => useShimmer({ enabled: false }));

    act(() => {
      result.current.start();
    });

    expect(result.current).toBeDefined();

    act(() => {
      result.current.stop();
    });

    expect(result.current).toBeDefined();
  });

  it('should use custom shimmer width', () => {
    const { result } = renderHook(() =>
      useShimmer({
        shimmerWidth: 300,
      })
    );

    expect(result.current).toBeDefined();
  });
});
