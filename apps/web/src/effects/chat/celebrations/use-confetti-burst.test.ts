import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfettiBurst } from './use-confetti-burst';
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

describe('useConfettiBurst', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConfettiBurst());

    expect(result.current.particles).toBeDefined();
    expect(result.current.containerOpacity).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.trigger).toBeDefined();

    expect(result.current.particles.length).toBe(120);
    expect(result.current.containerOpacity.value).toBe(0);
  });

  it('should limit particle count to 120', () => {
    const { result } = renderHook(() =>
      useConfettiBurst({
        particleCount: 200,
      })
    );

    expect(result.current.particles.length).toBe(120);
  });

  it('should trigger confetti animation', async () => {
    const { result } = renderHook(() => useConfettiBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.containerOpacity.value).toBeGreaterThan(0);
  });

  it('should log telemetry on trigger', () => {
    const { result } = renderHook(() => useConfettiBurst());

    act(() => {
      result.current.trigger();
    });

    expect(logEffectStart).toHaveBeenCalledWith('confetti-match', expect.objectContaining({
      particleCount: 120,
    }));
  });

  it('should log telemetry end after animation', async () => {
    const { result } = renderHook(() => useConfettiBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalled();
    });
  });

  it('should call onComplete callback after animation', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useConfettiBurst({ onComplete }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() => useConfettiBurst());

    act(() => {
      result.current.trigger();
    });

    // Reduced motion should use instant opacity changes
    expect(result.current.containerOpacity.value).toBeGreaterThan(0);
  });

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() => useConfettiBurst({ enabled: false }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.containerOpacity.value).toBe(0);
    expect(logEffectStart).not.toHaveBeenCalled();
  });

  it('should use custom colors', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    const { result } = renderHook(() => useConfettiBurst({ colors }));

    expect(result.current.particles.length).toBe(120);
  });

  it('should use custom duration', async () => {
    const duration = 1000;
    const { result } = renderHook(() => useConfettiBurst({ duration }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.containerOpacity.value).toBeGreaterThan(0);
  });

  it('should animate particles', async () => {
    const { result } = renderHook(() => useConfettiBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Particles should have animated values
    const particle = result.current.particles[0];
    expect(particle).toBeDefined();
    if (particle) {
      expect(particle.x).toBeDefined();
      expect(particle.y).toBeDefined();
      expect(particle.opacity).toBeDefined();
      expect(particle.scale).toBeDefined();
    }
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useConfettiBurst());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });
});
