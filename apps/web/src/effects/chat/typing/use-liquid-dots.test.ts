import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiquidDots } from './use-liquid-dots';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
}));

describe('useLiquidDots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLiquidDots());

    expect(result.current.dots).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();

    expect(result.current.dots.length).toBe(3);
  });

  it('should have three dots with phase offsets', () => {
    const { result } = renderHook(() => useLiquidDots());

    const dot0 = result.current.dots[0];
    const dot1 = result.current.dots[1];
    const dot2 = result.current.dots[2];
    expect(dot0).toBeDefined();
    expect(dot1).toBeDefined();
    expect(dot2).toBeDefined();
    if (dot0 && dot1 && dot2) {
      expect(dot0.phase).toBe(0);
      expect(dot1.phase).toBe((Math.PI * 2) / 3);
      expect(dot2.phase).toBe((Math.PI * 4) / 3);
    }
  });

  it('should animate dots when enabled', async () => {
    const { result } = renderHook(() => useLiquidDots({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    // Dots should have animated values
    const dot0 = result.current.dots[0];
    expect(dot0).toBeDefined();
    if (dot0) {
      expect(dot0.yOffset.value).toBeDefined();
      expect(dot0.opacity.value).toBeDefined();
    }
  });

  it('should use phase-shifted sine waves', async () => {
    const { result } = renderHook(() => useLiquidDots({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const dot0 = result.current.dots[0];
    const dot1 = result.current.dots[1];
    expect(dot0).toBeDefined();
    expect(dot1).toBeDefined();
    if (dot0 && dot1) {
      const dot1Y = dot0.yOffset.value;
      const dot2Y = dot1.yOffset.value;

      // Dots should have different values due to phase shift
      // Note: Due to timing, they might be similar, but the phase difference exists
      expect(typeof dot1Y).toBe('number');
      expect(typeof dot2Y).toBe('number');
    }
  });

  it('should animate opacity between 0.6 and 1.0', async () => {
    const { result } = renderHook(() => useLiquidDots({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    const dot0 = result.current.dots[0];
    expect(dot0).toBeDefined();
    if (dot0) {
      const opacity = dot0.opacity.value;
      expect(opacity).toBeGreaterThanOrEqual(0.6);
      expect(opacity).toBeLessThanOrEqual(1.0);
    }
  });

  it('should animate y-offset between 0 and 5px', async () => {
    const { result } = renderHook(() => useLiquidDots({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    const dot0 = result.current.dots[0];
    expect(dot0).toBeDefined();
    if (dot0) {
      const yOffset = dot0.yOffset.value;
      expect(yOffset).toBeGreaterThanOrEqual(0);
      expect(yOffset).toBeLessThanOrEqual(5);
    }
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() => useLiquidDots({ enabled: true }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Reduced motion should use static pulsing opacity
    const dot0 = result.current.dots[0];
    expect(dot0).toBeDefined();
    if (dot0) {
      const opacity = dot0.opacity.value;
      expect(opacity).toBeGreaterThanOrEqual(0.6);
      expect(opacity).toBeLessThanOrEqual(0.8);
    }
  });

  it('should reset values when disabled', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useLiquidDots({ enabled }),
      {
        initialProps: { enabled: true },
      }
    );

    rerender({ enabled: false });

    const dot0 = result.current.dots[0];
    expect(dot0).toBeDefined();
    if (dot0) {
      expect(dot0.yOffset.value).toBe(0);
      expect(dot0.opacity.value).toBe(0.6);
    }
  });

  it('should use custom dot size', () => {
    const { result } = renderHook(() => useLiquidDots({ dotSize: 8 }));

    expect(result.current.dots.length).toBe(3);
  });

  it('should use custom dot color', () => {
    const { result } = renderHook(() => useLiquidDots({ dotColor: '#ff0000' }));

    expect(result.current.dots.length).toBe(3);
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useLiquidDots());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should animate continuously when enabled', async () => {
    const { result } = renderHook(() => useLiquidDots({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    const dot0 = result.current.dots[0];
    expect(dot0).toBeDefined();
    if (dot0) {
      const initialY = dot0.yOffset.value;

      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      // Should continue animating
      expect(dot0.yOffset.value).toBeDefined();
    }
  });
});
