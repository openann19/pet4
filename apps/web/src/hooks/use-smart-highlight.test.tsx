import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartHighlight } from './use-smart-highlight';

describe('useSmartHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.backgroundOpacity.value).toBe(0);
    expect(result.current.glowOpacity.value).toBe(0);
    expect(result.current.glowRadius.value).toBe(0);
  });

  it('should trigger highlight when isHighlighted is true', () => {
    const { result } = renderHook(() => useSmartHighlight({ isHighlighted: true }));

    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
  });

  it('should trigger highlight manually', () => {
    const { result } = renderHook(() => useSmartHighlight());

    act(() => {
      result.current.trigger();
    });

    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
    expect(result.current.glowOpacity.value).toBeGreaterThan(0);
  });

  it('should respect custom highlight color', () => {
    const { result } = renderHook(() =>
      useSmartHighlight({ highlightColor: 'rgba(255, 0, 0, 0.5)' })
    );

    act(() => {
      result.current.trigger();
    });

    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
  });

  it('should respect custom glow color', () => {
    const { result } = renderHook(() => useSmartHighlight({ glowColor: 'rgba(0, 255, 0, 0.8)' }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.glowOpacity.value).toBeGreaterThan(0);
  });

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.backgroundStyle).toBeDefined();
    expect(result.current.glowStyle).toBeDefined();
  });

  it('should animate highlight on prop change', () => {
    const { result, rerender } = renderHook(
      ({ isHighlighted }) => useSmartHighlight({ isHighlighted }),
      { initialProps: { isHighlighted: false } }
    );

    expect(result.current.backgroundOpacity.value).toBe(0);

    rerender({ isHighlighted: true });

    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
  });
});
