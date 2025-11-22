import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSendWarp } from './use-send-warp';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectStart, logEffectEnd, clearActiveEffects } from '../core/telemetry';
import { useMotionPreferences } from '../../reanimated/useMotionPreferences';

// Mock dependencies
vi.mock('../core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('../core/telemetry', () => ({
  logEffectStart: vi.fn(() => 'test-effect-id'),
  logEffectEnd: vi.fn(),
  clearActiveEffects: vi.fn(),
}));

vi.mock('@/effects/reanimated/useMotionPreferences', () => ({
  useMotionPreferences: vi.fn(() => ({
    level: 'full',
    isReduced: false,
    isOff: false,
  })),
}));

describe('useSendWarp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSendWarp());

    expect(result.current.translateX).toBeDefined();
    expect(result.current.opacityValue).toBeDefined();
    expect(result.current.glowOpacity).toBeDefined();
    expect(result.current.bloomIntensity).toBeDefined();
    expect(result.current.trigger).toBeDefined();
    expect(result.current.triggerStatusChange).toBeDefined();

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.opacityValue.value).toBe(1);
    expect(result.current.glowOpacity.value).toBe(0);
    expect(result.current.bloomIntensity.value).toBe(0);
  });

  it('should trigger slide animation', async () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    // Advance timers to allow animation to progress
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Check that animation values have changed
    expect(result.current.translateX.value).toBeGreaterThan(0);
    expect(result.current.opacityValue.value).toBeLessThan(1);
  });

  it('should trigger haptic feedback on send', () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    expect(triggerHaptic).toHaveBeenCalledWith('selection');
  });

  it('should trigger haptic feedback on status change', () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.triggerStatusChange('sent');
    });

    expect(triggerHaptic).toHaveBeenCalledWith('light');
  });

  it('should log telemetry on trigger', () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    expect(logEffectStart).toHaveBeenCalledWith('send-warp', {
      reducedMotion: false,
      level: 'full',
    });
  });

  it('should log telemetry end after animation', async () => {
    const { result } = renderHook(() => useSendWarp());

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
    const { result } = renderHook(() => useSendWarp({ onComplete }));

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

  it('should call onStatusChange callback', () => {
    const onStatusChange = vi.fn();
    const { result } = renderHook(() => useSendWarp({ onStatusChange }));

    act(() => {
      result.current.triggerStatusChange('sent');
    });

    expect(onStatusChange).toHaveBeenCalledWith('sent');
  });

  it('should respect reduced motion', () => {
    vi.mocked(useMotionPreferences).mockReturnValue({
      level: 'reduced',
      isReduced: true,
      isOff: false,
    });

    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    // Glow and bloom should not animate in reduced motion
    expect(result.current.glowOpacity.value).toBe(0);
    expect(result.current.bloomIntensity.value).toBe(0);
  });

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() => useSendWarp({ enabled: false }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should not trigger twice', () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    const firstTranslateX = result.current.translateX.value;

    act(() => {
      result.current.trigger();
    });

    // Second trigger should not change values
    expect(result.current.translateX.value).toBe(firstTranslateX);
    expect(triggerHaptic).toHaveBeenCalledTimes(1);
  });

  it('should animate glow trail when not reduced motion', async () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Glow should animate
    expect(result.current.glowOpacity.value).toBeGreaterThan(0);
  });

  it('should animate bloom intensity when not reduced motion', async () => {
    const { result } = renderHook(() => useSendWarp());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(60);
    });

    // Bloom should animate
    expect(result.current.bloomIntensity.value).toBeGreaterThan(0);
  });
});
