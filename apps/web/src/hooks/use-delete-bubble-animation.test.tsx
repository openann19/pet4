import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteBubbleAnimation } from './use-delete-bubble-animation';

describe('useDeleteBubbleAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation());

    expect(result.current.opacity.value).toBe(1);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.translateX.value).toBe(0);
    expect(result.current.height.value).toBe(60);
    expect(result.current.rotation.value).toBe(0);
  });

  it('should trigger self-delete animation', async () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'self-delete' }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.translateY.value).toBeLessThan(0);
  });

  it('should trigger admin-delete animation', async () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'admin-delete' }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should trigger emoji-media delete animation', async () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'emoji-media' }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.rotation.value).not.toBe(0);
  });

  it('should trigger group-chat delete animation', async () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'group-chat' }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.scale.value).toBeLessThan(1);
    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should call onFinish callback after animation', async () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useDeleteBubbleAnimation({ onFinish, duration: 300 }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should reset animation', async () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation());

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(50);
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.opacity.value).toBe(1);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.translateX.value).toBe(0);
    expect(result.current.height.value).toBe(60);
    expect(result.current.rotation.value).toBe(0);
  });

  it('should provide animated style', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation());

    expect(result.current.animatedStyle).toBeDefined();
  });

  it('should respect custom duration', async () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useDeleteBubbleAnimation({ onFinish, duration: 500 }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(onFinish).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should work without haptic feedback', async () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ hapticFeedback: false }));

    await act(async () => {
      result.current.triggerDelete();
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should handle all animation contexts', async () => {
    const contexts: ('self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat')[] = [
      'self-delete',
      'admin-delete',
      'emoji-media',
      'group-chat',
    ];

    for (const context of contexts) {
      const { result } = renderHook(() => useDeleteBubbleAnimation({ context }));

      await act(async () => {
        result.current.triggerDelete();
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(result.current.opacity.value).toBeDefined();
      expect(result.current.scale.value).toBeDefined();
    }
  });
});
