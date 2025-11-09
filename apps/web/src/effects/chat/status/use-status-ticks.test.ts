import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStatusTicks } from './use-status-ticks';
import { triggerHaptic } from '../core/haptic-manager';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}));

describe('useStatusTicks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'sending',
      })
    );

    expect(result.current.tick1Opacity).toBeDefined();
    expect(result.current.tick2Opacity).toBeDefined();
    expect(result.current.tick1Fill).toBeDefined();
    expect(result.current.tick2Fill).toBeDefined();
    expect(result.current.color).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
  });

  it('should update tick fill for sending status', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'sending',
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(result.current.tick1Fill.value).toBe(0);
    expect(result.current.tick2Fill.value).toBe(0);
    expect(result.current.color.value).toBe('#999999');
  });

  it('should update tick fill for sent status', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'sent',
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(result.current.tick1Fill.value).toBe(1);
    expect(result.current.tick2Fill.value).toBe(0);
    expect(result.current.color.value).toBe('#666666');
  });

  it('should update tick fill for delivered status', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'delivered',
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(result.current.tick1Fill.value).toBe(1);
    expect(result.current.tick2Fill.value).toBe(1);
    expect(result.current.color.value).toBe('#666666');
  });

  it('should update tick fill for read status', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'read',
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(result.current.tick1Fill.value).toBe(1);
    expect(result.current.tick2Fill.value).toBe(1);
    expect(result.current.color.value).toBe('#3B82F6');
  });

  it('should trigger haptic on delivered→read transition for own messages', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'read',
        previousStatus: 'delivered',
        isOwnMessage: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(triggerHaptic).toHaveBeenCalledWith('selection');
  });

  it('should not trigger haptic for non-own messages', () => {
    renderHook(() =>
      useStatusTicks({
        status: 'read',
        previousStatus: 'delivered',
        isOwnMessage: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should not trigger haptic for other transitions', () => {
    renderHook(() =>
      useStatusTicks({
        status: 'sent',
        previousStatus: 'sending',
        isOwnMessage: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'sent',
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    // Should still update values but with linear easing
    expect(result.current.tick1Fill.value).toBe(1);
  });

  it('should not update when disabled', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        enabled: false,
        status: 'sent',
      })
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    // Initial values should remain
    expect(result.current.tick1Fill.value).toBe(0);
  });

  it('should return animated style', () => {
    const { result } = renderHook(() =>
      useStatusTicks({
        status: 'sending',
      })
    );

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should animate color change', () => {
    type Status = 'sending' | 'sent' | 'delivered' | 'read';
    const { result, rerender } = renderHook(
      (props: { status: Status }) =>
        useStatusTicks({
          status: props.status,
        }),
      {
        initialProps: { status: 'sending' as Status },
      }
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(result.current.color.value).toBe('#999999');

    rerender({ status: 'read' as Status });

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(result.current.color.value).toBe('#3B82F6');
  });
});
