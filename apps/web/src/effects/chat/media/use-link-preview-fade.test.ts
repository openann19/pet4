import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLinkPreviewFade } from './use-link-preview-fade';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}));

describe('useLinkPreviewFade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLinkPreviewFade());

    expect(result.current.skeletonOpacity).toBeDefined();
    expect(result.current.contentOpacity).toBeDefined();
    expect(result.current.skeletonTranslateY).toBeDefined();
    expect(result.current.contentTranslateY).toBeDefined();
    expect(result.current.skeletonAnimatedStyle).toBeDefined();
    expect(result.current.contentAnimatedStyle).toBeDefined();
  });

  it('should show skeleton when loading', () => {
    const { result } = renderHook(() =>
      useLinkPreviewFade({
        isLoading: true,
        isLoaded: false,
      })
    );

    expect(result.current.skeletonOpacity.value).toBe(1);
    expect(result.current.contentOpacity.value).toBe(0);
  });

  it('should hide skeleton and show content when loaded', async () => {
    const { result, rerender } = renderHook(
      ({ isLoading, isLoaded }) =>
        useLinkPreviewFade({
          isLoading,
          isLoaded,
        }),
      {
        initialProps: { isLoading: true, isLoaded: false },
      }
    );

    expect(result.current.skeletonOpacity.value).toBe(1);
    expect(result.current.contentOpacity.value).toBe(0);

    rerender({ isLoading: false, isLoaded: true });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(result.current.skeletonOpacity.value).toBeLessThan(1);
    });
  });

  it('should animate skeleton fade in', async () => {
    const { result } = renderHook(() =>
      useLinkPreviewFade({
        isLoading: true,
        isLoaded: false,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.skeletonOpacity.value).toBeGreaterThan(0);
  });

  it('should animate content fade in', async () => {
    const { result, rerender } = renderHook(
      ({ isLoading, isLoaded }) =>
        useLinkPreviewFade({
          isLoading,
          isLoaded,
        }),
      {
        initialProps: { isLoading: false, isLoaded: true },
      }
    );

    await act(async () => {
      vi.advanceTimersByTime(180);
    });

    await waitFor(() => {
      expect(result.current.contentOpacity.value).toBeGreaterThan(0);
    });
  });

  it('should animate content translateY', async () => {
    const { result } = renderHook(() =>
      useLinkPreviewFade({
        isLoading: false,
        isLoaded: true,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(180);
    });

    await waitFor(() => {
      expect(result.current.contentTranslateY.value).toBeLessThanOrEqual(0);
    });
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result, rerender } = renderHook(
      ({ isLoading, isLoaded }) =>
        useLinkPreviewFade({
          isLoading,
          isLoaded,
        }),
      {
        initialProps: { isLoading: true, isLoaded: false },
      }
    );

    expect(result.current.skeletonOpacity.value).toBe(1);

    rerender({ isLoading: false, isLoaded: true });

    // Instant reveal in reduced motion
    expect(result.current.skeletonOpacity.value).toBe(0);
    expect(result.current.contentOpacity.value).toBe(1);
    expect(result.current.contentTranslateY.value).toBe(0);
  });

  it('should not animate when disabled', () => {
    const { result } = renderHook(() =>
      useLinkPreviewFade({
        enabled: false,
        isLoading: true,
        isLoaded: false,
      })
    );

    // Should maintain initial state
    expect(result.current.skeletonOpacity.value).toBe(1);
  });

  it('should return skeleton animated style', () => {
    const { result } = renderHook(() => useLinkPreviewFade());

    expect(result.current.skeletonAnimatedStyle).toBeDefined();
    expect(typeof result.current.skeletonAnimatedStyle).toBe('object');
  });

  it('should return content animated style', () => {
    const { result } = renderHook(() => useLinkPreviewFade());

    expect(result.current.contentAnimatedStyle).toBeDefined();
    expect(typeof result.current.contentAnimatedStyle).toBe('object');
  });

  it('should crossfade from skeleton to content', async () => {
    const { result, rerender } = renderHook(
      ({ isLoading, isLoaded }) =>
        useLinkPreviewFade({
          isLoading,
          isLoaded,
        }),
      {
        initialProps: { isLoading: true, isLoaded: false },
      }
    );

    expect(result.current.skeletonOpacity.value).toBe(1);
    expect(result.current.contentOpacity.value).toBe(0);

    rerender({ isLoading: false, isLoaded: true });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Skeleton should fade out
    await waitFor(() => {
      expect(result.current.skeletonOpacity.value).toBeLessThan(1);
    });

    await act(async () => {
      vi.advanceTimersByTime(180);
    });

    // Content should fade in
    await waitFor(() => {
      expect(result.current.contentOpacity.value).toBeGreaterThan(0);
    });
  });
});
