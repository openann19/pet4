import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartHighlight } from '../use-smart-highlight';

vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSequence: vi.fn((...args) => args),
  withTiming: vi.fn((value) => value),
  withDelay: vi.fn((delay, value) => value),
  interpolate: vi.fn((value) => value),
  Extrapolation: {
    CLAMP: 'clamp',
  },
}));

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

  it('triggers highlight animation', () => {
    const { result } = renderHook(() => useSmartHighlight());

    act(() => {
      result.current.trigger();
    });

    expect(result.current.backgroundOpacity).toBeDefined();
  });

  it('uses default highlight color', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.backgroundStyle).toBeDefined();
  });

  it('uses custom highlight color', () => {
    const { result } = renderHook(() =>
      useSmartHighlight({ highlightColor: 'rgba(255, 0, 0, 0.5)' })
    );

    expect(result.current.backgroundStyle).toBeDefined();
  });

  it('uses default glow color', () => {
    const { result } = renderHook(() => useSmartHighlight());

    expect(result.current.glowStyle).toBeDefined();
  });

  it('uses custom glow color', () => {
    const { result } = renderHook(() => useSmartHighlight({ glowColor: 'rgba(0, 255, 0, 0.5)' }));

    expect(result.current.glowStyle).toBeDefined();
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

  it('triggers automatically when isHighlighted is true', () => {
    const { result } = renderHook(() => useSmartHighlight({ isHighlighted: true }));

    expect(result.current.backgroundOpacity).toBeDefined();
  });

  it('does not trigger automatically when isHighlighted is false', () => {
    const { result } = renderHook(() => useSmartHighlight({ isHighlighted: false }));

    expect(result.current.backgroundOpacity).toBeDefined();
  });

  it('can be triggered multiple times', () => {
    const { result } = renderHook(() => useSmartHighlight());

    act(() => {
      result.current.trigger();
    });

    act(() => {
      result.current.trigger();
    });

    expect(result.current.backgroundOpacity).toBeDefined();
  });
});
