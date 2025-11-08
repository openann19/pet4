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

  it('should trigger self-delete animation', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'self-delete' }));

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.translateY.value).toBeLessThan(0);
  });

  it('should trigger admin-delete animation', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'admin-delete' }));

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should trigger emoji-media delete animation', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'emoji-media' }));

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeGreaterThan(1);
    expect(result.current.rotation.value).not.toBe(0);
  });

  it('should trigger group-chat delete animation', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ context: 'group-chat' }));

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.scale.value).toBeLessThan(1);
    expect(result.current.opacity.value).toBeLessThan(1);
  });

  it('should call onFinish callback after animation', () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useDeleteBubbleAnimation({ onFinish, duration: 300 }));

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should reset animation', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation());

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
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

  it('should respect custom duration', () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useDeleteBubbleAnimation({ onFinish, duration: 500 }));

    act(() => {
      result.current.triggerDelete();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onFinish).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should work without haptic feedback', () => {
    const { result } = renderHook(() => useDeleteBubbleAnimation({ hapticFeedback: false }));

    expect(() => {
      act(() => {
        result.current.triggerDelete();
      });
    }).not.toThrow();
  });

  it('should handle all animation contexts', () => {
    const contexts: ('self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat')[] = [
      'self-delete',
      'admin-delete',
      'emoji-media',
      'group-chat',
    ];

    contexts.forEach((context) => {
      const { result } = renderHook(() => useDeleteBubbleAnimation({ context }));

      expect(() => {
        act(() => {
          result.current.triggerDelete();
        });
      }).not.toThrow();
    });
  });
});
