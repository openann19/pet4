import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReactionBurst } from './use-reaction-burst';
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

describe('useReactionBurst', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useReactionBurst());

    expect(result.current.particles).toBeDefined();
    expect(result.current.emojiScale).toBeDefined();
    expect(result.current.emojiTranslateY).toBeDefined();
    expect(result.current.shadowRadius).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.trigger).toBeDefined();
    expect(result.current.triggerLongPress).toBeDefined();

    expect(result.current.particles.length).toBe(8);
    expect(result.current.emojiScale.value).toBe(1);
    expect(result.current.shadowRadius.value).toBe(2);
  });

  it('should trigger reaction burst animation', async () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.emojiScale.value).toBeGreaterThan(1);
    expect(result.current.emojiTranslateY.value).toBeLessThan(0);
  });

  it('should trigger haptic feedback on attach', () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    expect(triggerHaptic).toHaveBeenCalledWith('light');
  });

  it('should trigger haptic feedback on long press', () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.triggerLongPress();
    });

    expect(triggerHaptic).toHaveBeenCalledWith('success');
  });

  it('should call onLongPressConfirm callback', () => {
    const onLongPressConfirm = vi.fn();
    const { result } = renderHook(() => useReactionBurst({ onLongPressConfirm }));

    act(() => {
      result.current.triggerLongPress();
    });

    expect(onLongPressConfirm).toHaveBeenCalled();
  });

  it('should log telemetry on trigger', () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    expect(logEffectStart).toHaveBeenCalledWith('reaction-burst', {
      reducedMotion: false,
    });
  });

  it('should log telemetry end after animation', async () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(280);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalled();
    });
  });

  it('should call onComplete callback after animation', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useReactionBurst({ onComplete }));

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(280);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should animate particles in ring pattern', async () => {
    const { result } = renderHook(() => useReactionBurst());

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
      expect(particle.x.value).toBeDefined();
      expect(particle.y.value).toBeDefined();
      expect(particle.opacity.value).toBeDefined();
      expect(particle.scale.value).toBeDefined();
    }
  });

  it('should animate emoji lift with spring', async () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.emojiScale.value).toBeGreaterThan(1);
    expect(result.current.emojiTranslateY.value).toBeLessThan(0);
  });

  it('should animate shadow radius', async () => {
    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.shadowRadius.value).toBeGreaterThan(2);
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() => useReactionBurst());

    act(() => {
      result.current.trigger();
    });

    // Particles should not animate in reduced motion
    const particle = result.current.particles[0];
    if (particle) {
      expect(particle.opacity.value).toBe(0);
    }
  });

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() => useReactionBurst({ enabled: false }));

    act(() => {
      result.current.trigger();
    });

    expect(result.current.emojiScale.value).toBe(1);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useReactionBurst());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });
});
