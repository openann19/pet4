import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBubbleVariant, type BubbleVariant } from './use-bubble-variant';

describe('useBubbleVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values when disabled', () => {
    const { result } = renderHook(() => useBubbleVariant({ variant: 'default', enabled: false }));

    expect(result.current.opacity.value).toBe(1);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.scale.value).toBe(1);
  });

  it('should initialize with hidden values when enabled', () => {
    const { result } = renderHook(() => useBubbleVariant({ variant: 'default', enabled: true }));

    expect(result.current.opacity.value).toBeLessThan(1);
    expect(result.current.translateY.value).toBeGreaterThan(0);
    expect(result.current.scale.value).toBeLessThan(1);
  });

  it('should animate AI answer variant', () => {
    const { result } = renderHook(() => useBubbleVariant({ variant: 'ai-answer', enabled: true }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.glowOpacity.value).toBeGreaterThan(0);
    expect(result.current.tilt.value).toBeGreaterThan(0);
  });

  it('should animate user reply variant', () => {
    const { result } = renderHook(() => useBubbleVariant({ variant: 'user-reply', enabled: true }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.translateY.value).toBeLessThanOrEqual(0);
  });

  it('should animate thread message variant', () => {
    const { result } = renderHook(() =>
      useBubbleVariant({ variant: 'thread-message', enabled: true })
    );

    act(() => {
      result.current.trigger();
    });

    expect(result.current.translateY.value).toBeLessThanOrEqual(0);
    expect(result.current.scale.value).toBeGreaterThan(0);
  });

  it('should animate default variant', () => {
    const { result } = renderHook(() => useBubbleVariant({ variant: 'default', enabled: true }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.opacity.value).toBeGreaterThan(0);
  });

  it('should respect custom delay', () => {
    const { result } = renderHook(() =>
      useBubbleVariant({ variant: 'default', enabled: true, delay: 100 })
    );

    act(() => {
      result.current.trigger();
    });

    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useBubbleVariant({ variant: 'default', enabled: false }));

    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.glowStyle).toBeDefined();
  });

  it('should animate on variant change', () => {
    const { result, rerender } = renderHook(
      ({ variant }: { variant: BubbleVariant }) => useBubbleVariant({ variant, enabled: true }),
      { initialProps: { variant: 'default' } }
    );

    const initialGlow = result.current.glowOpacity.value;

    rerender({ variant: 'ai-answer' });

    expect(result.current.glowOpacity.value).toBeGreaterThanOrEqual(initialGlow);
  });
});
