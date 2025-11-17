/**
 * Tests for useMatchConfetti Hook (Web)
 *
 * Location: apps/web/src/effects/chat/celebrations/use-match-confetti.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMatchConfetti } from './use-match-confetti';

// Mock dependencies
vi.mock('../core/reduced-motion', () => ({
  useReducedMotion: vi.fn(() => false),
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}));

vi.mock('../core/seeded-rng', () => ({
  createSeededRNG: vi.fn(() => ({
    range: vi.fn(() => 0.5),
    rangeInt: vi.fn(() => 8),
  })),
  randomRange: vi.fn(() => 100),
}));

vi.mock('../core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('../core/telemetry', () => ({
  logEffectStart: vi.fn(() => 'test-effect-id'),
  logEffectEnd: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('@/hooks/useUIConfig', () => ({
  useUIConfig: vi.fn(() => ({
    animation: {
      showParticles: true,
    },
    feedback: {
      haptics: true,
      sound: true,
    },
  })),
}));

describe('useMatchConfetti', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMatchConfetti());

    expect(result.current.isActive).toBe(false);
    expect(typeof result.current.trigger).toBe('function');
  });

  it('should trigger confetti animation', () => {
    const { result } = renderHook(() => useMatchConfetti());
    const addEventListenerSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger('test-seed');
    });

    expect(addEventListenerSpy).toHaveBeenCalled();
    const event = addEventListenerSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.type).toBe('match-confetti-trigger');
    expect(event.detail).toMatchObject({
      particleCount: expect.any(Number),
      colors: expect.any(Array),
      duration: expect.any(Number),
      seed: expect.any(String),
    });
  });

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() =>
      useMatchConfetti({ enabled: false })
    );
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger();
    });

    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('should not trigger when already active', () => {
    const { result } = renderHook(() => useMatchConfetti());
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger();
    });

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);

    // Try to trigger again while active
    act(() => {
      result.current.trigger();
    });

    // Should still be 1 (not called again)
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete after duration', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useMatchConfetti({ duration: 1000, onComplete })
    );

    act(() => {
      result.current.trigger();
    });

    expect(onComplete).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('should respect particle count limit', () => {
    const { result } = renderHook(() =>
      useMatchConfetti({ particleCount: 200 }) // Over limit
    );
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger();
    });

    const event = dispatchEventSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.particleCount).toBeLessThanOrEqual(120); // Max GPU budget
  });

  it('should use custom colors', () => {
    const customColors = ['#FF0000', '#00FF00', '#0000FF'];
    const { result } = renderHook(() =>
      useMatchConfetti({ colors: customColors })
    );
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger();
    });

    const event = dispatchEventSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.colors).toEqual(customColors);
  });

  it('should log telemetry on start and end', async () => {
    const { logEffectStart, logEffectEnd } = await import('../core/telemetry');
    const { result } = renderHook(() =>
      useMatchConfetti({ duration: 500 })
    );

    act(() => {
      result.current.trigger();
    });

    expect(logEffectStart).toHaveBeenCalledWith('match-confetti', expect.any(Object));

    act(() => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalledWith('test-effect-id', expect.any(Object));
    });
  });

  it('should trigger haptic feedback', async () => {
    const { triggerHaptic } = await import('../core/haptic-manager');
    const { result } = renderHook(() => useMatchConfetti());

    act(() => {
      result.current.trigger();
    });

    expect(triggerHaptic).toHaveBeenCalledWith('success');
  });

  it('should use seeded RNG for consistency', () => {
    const { result } = renderHook(() => useMatchConfetti());
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger('test-seed-123');
    });

    const event = dispatchEventSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.seed).toBe('test-seed-123');
  });

  it('should handle reduced motion', async () => {
    const { useReducedMotion, getReducedMotionDuration } = await import(
      '../core/reduced-motion'
    );
    vi.mocked(useReducedMotion).mockReturnValue(true);
    vi.mocked(getReducedMotionDuration).mockImplementation((duration: number) =>
      Math.min(120, duration)
    );

    const { result } = renderHook(() =>
      useMatchConfetti({ duration: 1000 })
    );
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    act(() => {
      result.current.trigger();
    });

    const event = dispatchEventSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.duration).toBeLessThanOrEqual(120);
  });
});
