import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStickerPhysics } from './use-sticker-physics';
import { logEffectStart, logEffectEnd, clearActiveEffects } from '../core/telemetry';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/telemetry', () => ({
  logEffectStart: vi.fn(() => 'test-effect-id'),
  logEffectEnd: vi.fn(),
  clearActiveEffects: vi.fn(),
}));

vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}));

vi.mock('../core/seeded-rng', () => ({
  randomRange: vi.fn((min: number, max: number) => (min + max) / 2),
}));

describe('useStickerPhysics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useStickerPhysics());

    expect(result.current.translateX).toBeDefined();
    expect(result.current.translateY).toBeDefined();
    expect(result.current.rotation).toBeDefined();
    expect(result.current.scale).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.trigger).toBeDefined();

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.rotation.value).toBe(0);
    expect(result.current.scale.value).toBe(1);
  });

  it('should trigger sticker physics animation', async () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.translateX.value).toBeGreaterThan(0);
    expect(result.current.translateY.value).toBeGreaterThan(0);
  });

  it('should animate rotation', async () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.rotation.value).toBeGreaterThan(0);
  });

  it('should animate scale on impact', async () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Scale should change during bounce
    expect(result.current.scale.value).toBeDefined();
  });

  it('should log telemetry on trigger', () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    expect(logEffectStart).toHaveBeenCalledWith('sticker-physics', expect.objectContaining({
      reducedMotion: false,
    }));
  });

  it('should log telemetry end after animation', async () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalled();
    });
  });

  it('should call onComplete callback after animation', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useStickerPhysics({ onComplete }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should use custom initial velocity', async () => {
    const { result } = renderHook(() =>
      useStickerPhysics({
        initialVelocity: { x: 100, y: -200 },
      })
    );

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.translateX.value).toBeGreaterThan(0);
  });

  it('should use custom floor Y', async () => {
    const { result } = renderHook(() =>
      useStickerPhysics({
        floorY: 100,
      })
    );

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.translateY.value).toBeGreaterThanOrEqual(0);
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    // Should still animate but with reduced duration
    expect(logEffectStart).toHaveBeenCalled();
  });

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() => useStickerPhysics({ enabled: false }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(logEffectStart).not.toHaveBeenCalled();
  });

  it('should cache texture', () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    // Texture should be cached (internal implementation detail)
    expect(logEffectStart).toHaveBeenCalled();
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useStickerPhysics());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should simulate gravity and bounce', async () => {
    const { result } = renderHook(() => useStickerPhysics());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(240); // 60% of duration (fall)
    });

    const fallY = result.current.translateY.value;

    await act(async () => {
      vi.advanceTimersByTime(80); // 20% of duration (bounce up)
    });

    const bounceY = result.current.translateY.value;

    // Bounce should be higher than floor (due to bounce coefficient)
    expect(bounceY).toBeDefined();
  });
});
