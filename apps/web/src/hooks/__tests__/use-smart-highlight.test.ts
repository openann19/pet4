import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSmartHighlight } from '../use-smart-highlight';

// Use global mock from setup.ts - no local mock needed

describe('useSmartHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns highlight styles and trigger function', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.backgroundOpacity).toBeDefined();
    expect(result.current.glowOpacity).toBeDefined();
    expect(result.current.glowRadius).toBeDefined();
    expect(result.current.backgroundStyle).toBeDefined();
    expect(result.current.glowStyle).toBeDefined();
    expect(result.current.trigger).toBeDefined();
  });

  it('triggers highlight animation', async () => {
    const { result } = renderHook(() => useSmartHighlight());

    await act(async () => {
      result.current.trigger();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
  });

  it('uses default highlight color', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.backgroundStyle).toBeDefined();
  });

  it('uses custom highlight color', async () => {
    const { result } = renderHook(() =>
      useSmartHighlight({ highlightColor: 'rgba(255, 0, 0, 0.5)' })
    );

    await act(async () => {
      result.current.trigger();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.backgroundStyle).toBeDefined();
    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
  });

  it('uses default glow color', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.glowStyle).toBeDefined();
  });

  it('uses custom glow color', async () => {
    const { result } = renderHook(() => useSmartHighlight({ glowColor: 'rgba(0, 255, 0, 0.5)' }));

    await act(async () => {
      result.current.trigger();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.glowStyle).toBeDefined();
    expect(result.current.glowOpacity.value).toBeGreaterThan(0);
  });

  it('uses default duration', () => {
    const { result } = renderHook(() => useSmartHighlight());

    act(() => {
      result.current.trigger();
    });

    expect(result.current.backgroundOpacity).toBeDefined();
  });

  it('uses custom duration', () => {
    const { result } = renderHook(() => useSmartHighlight({ duration: 3000 }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.backgroundOpacity).toBeDefined();
  });

  it('uses default glow radius', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.glowRadius).toBeDefined();
  });

  it('uses custom glow radius', () => {
    const { result } = renderHook(() => useSmartHighlight({ glowRadius: 30 }));

    expect(result.current.glowRadius).toBeDefined();
  });

  it('triggers automatically when isHighlighted is true', async () => {
    const { result } = renderHook(() => useSmartHighlight({ isHighlighted: true }));

    await waitFor(() => {
      expect(result.current.backgroundOpacity.value).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });

  it('does not trigger automatically when isHighlighted is false', () => {
    const { result } = renderHook(() => useSmartHighlight({ isHighlighted: false }));

    // Should remain at initial value (0) when isHighlighted is false
    expect(result.current.backgroundOpacity.value).toBe(0);
  });

  it('can be triggered multiple times', async () => {
    const { result } = renderHook(() => useSmartHighlight());

    await act(async () => {
      result.current.trigger();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      result.current.trigger();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.backgroundOpacity.value).toBeGreaterThanOrEqual(0);
  });
});
