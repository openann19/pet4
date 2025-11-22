import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReplyRibbon } from './use-reply-ribbon';
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

describe('useReplyRibbon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveEffects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useReplyRibbon());

    expect(result.current.ribbonP0).toBeDefined();
    expect(result.current.ribbonP1).toBeDefined();
    expect(result.current.ribbonP2).toBeDefined();
    expect(result.current.ribbonThickness).toBeDefined();
    expect(result.current.ribbonOpacity).toBeDefined();
    expect(result.current.ribbonProgress).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.start).toBeDefined();
    expect(result.current.update).toBeDefined();
    expect(result.current.complete).toBeDefined();
    expect(result.current.cancel).toBeDefined();

    expect(result.current.ribbonOpacity.value).toBe(0);
    expect(result.current.ribbonProgress.value).toBe(0);
  });

  it('should start ribbon animation', () => {
    const { result } = renderHook(() => useReplyRibbon());

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    expect(result.current.ribbonP0.value).toBeDefined();
    expect(result.current.ribbonP1.value).toBeDefined();
  });

  it('should trigger haptic feedback on start', () => {
    const { result } = renderHook(() => useReplyRibbon());

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    expect(triggerHaptic).toHaveBeenCalledWith('light');
  });

  it('should log telemetry on start', () => {
    const { result } = renderHook(() => useReplyRibbon());

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    expect(logEffectStart).toHaveBeenCalledWith('reply-ribbon', {
      startPoint: { x: 100, y: 100 },
    });
  });

  it('should update ribbon position', () => {
    const { result } = renderHook(() => useReplyRibbon());

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    act(() => {
      result.current.update({ x: 150, y: 150 });
    });

    expect(result.current.ribbonP1.value.x).toBe(150);
    expect(result.current.ribbonP1.value.y).toBe(150);
  });

  it('should complete ribbon animation', async () => {
    const onComplete = vi.fn();
    const composerRect = new DOMRect(200, 200, 100, 50);
    const { result } = renderHook(() =>
      useReplyRibbon({
        composerRect,
        onComplete,
      })
    );

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    act(() => {
      result.current.complete();
    });

    await act(async () => {
      vi.advanceTimersByTime(180);
    });

    await waitFor(() => {
      expect(logEffectEnd).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should cancel ribbon animation', async () => {
    const { result } = renderHook(() => useReplyRibbon());

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      vi.advanceTimersByTime(90);
    });

    expect(result.current.ribbonOpacity.value).toBeLessThan(1);
  });

  it('should use bubble rect for start point', () => {
    const bubbleRect = new DOMRect(50, 50, 100, 60);
    const { result } = renderHook(() =>
      useReplyRibbon({
        bubbleRect,
      })
    );

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    // Should use bubble rect center
    expect(result.current.ribbonP0.value.x).toBe(100);
    expect(result.current.ribbonP0.value.y).toBe(80);
  });

  it('should update progress based on composer distance', () => {
    const composerRect = new DOMRect(200, 200, 100, 50);
    const { result } = renderHook(() =>
      useReplyRibbon({
        composerRect,
      })
    );

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    act(() => {
      result.current.update({ x: 150, y: 150 });
    });

    expect(result.current.ribbonProgress.value).toBeGreaterThan(0);
  });

  it('should not start when disabled', () => {
    const { result } = renderHook(() => useReplyRibbon({ enabled: false }));

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    expect(result.current.ribbonOpacity.value).toBe(0);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should not start when already active', () => {
    const { result } = renderHook(() => useReplyRibbon());

    act(() => {
      result.current.start({ x: 100, y: 100 });
    });

    const firstOpacity = result.current.ribbonOpacity.value;

    act(() => {
      result.current.start({ x: 200, y: 200 });
    });

    // Should not start again
    expect(result.current.ribbonOpacity.value).toBe(firstOpacity);
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useReplyRibbon());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });
});
