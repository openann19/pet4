import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReceiveAirCushion } from './use-receive-air-cushion';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectStart, logEffectEnd, clearActiveEffects } from '../core/telemetry';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}));

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

describe('useReceiveAirCushion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useReceiveAirCushion());

    expect(result.current.scale).toBeDefined();
    expect(result.current.shadowOpacity).toBeDefined();
    expect(result.current.shadowRadius).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.trigger).toBeDefined();

    // Initial values for new messages
    expect(result.current.scale.value).toBe(0.98);
    expect(result.current.shadowOpacity.value).toBe(0);
    expect(result.current.shadowRadius.value).toBe(0);
  });

  it('should initialize with scale 1.0 for non-new messages', () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: false }));

    expect(result.current.scale.value).toBe(1.0);
  });

  it('should trigger spring scale animation', async () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Scale should animate towards 1.0
    expect(result.current.scale.value).toBeGreaterThan(0.98);
  });

  it('should trigger shadow animation', async () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(120);
    });

    // Shadow should animate
    expect(result.current.shadowOpacity.value).toBeGreaterThan(0);
    expect(result.current.shadowRadius.value).toBeGreaterThan(0);
  });

  it('should trigger haptic feedback on mention', () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true, isMention: true }));

    act(() => {
      result.current.trigger();
    });

    expect(triggerHaptic).toHaveBeenCalledWith('light');
  });

  it('should not trigger haptic feedback by default', () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true, isMention: false }));

    act(() => {
      result.current.trigger();
    });

    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should log telemetry on trigger', () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    expect(logEffectStart).toHaveBeenCalledWith('receive-air-cushion', {
      reducedMotion: false,
      isMention: false,
    });
  });

  it('should log telemetry end after animation', async () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(220);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalled();
    });
  });

  it('should call onComplete callback after animation', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true, onComplete }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(220);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    // Scale should instantly go to 1.0 in reduced motion
    expect(result.current.scale.value).toBe(1.0);
  });

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() => useReceiveAirCushion({ enabled: false, isNew: true }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.scale.value).toBe(0.98);
    expect(logEffectStart).not.toHaveBeenCalled();
  });

  it('should not trigger when not new', () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: false }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.scale.value).toBe(1.0);
    expect(logEffectStart).not.toHaveBeenCalled();
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useReceiveAirCushion());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should use spring physics for scale animation', async () => {
    const { result } = renderHook(() => useReceiveAirCushion({ isNew: true }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Scale should animate smoothly with spring physics
    const initialScale = 0.98;
    const currentScale = result.current.scale.value;
    expect(currentScale).toBeGreaterThan(initialScale);
    expect(currentScale).toBeLessThanOrEqual(1.0);
  });
});
