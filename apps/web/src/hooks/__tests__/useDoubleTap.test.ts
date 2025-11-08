import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDoubleTap } from '../useDoubleTap';

describe('useDoubleTap', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    vi.useRealTimers();
  });

  it('returns ref', () => {
    const { result } = renderHook(() => useDoubleTap());

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('calls onDoubleTap for double tap', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onDoubleTap: mockOnDoubleTap }));

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent1 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const clickEvent2 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent2);

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('calls onSingleTap for single tap', async () => {
    const mockOnSingleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onSingleTap: mockOnSingleTap }));

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockOnSingleTap).toHaveBeenCalledTimes(1);
  });

  it('does not call onSingleTap for double tap', async () => {
    const mockOnSingleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onSingleTap: mockOnSingleTap }));

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent1 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const clickEvent2 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent2);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockOnSingleTap).not.toHaveBeenCalled();
  });

  it('respects custom delay', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() =>
      useDoubleTap({ onDoubleTap: mockOnDoubleTap }, { delay: 500 })
    );

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent1 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent1);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const clickEvent2 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent2);

    expect(mockOnDoubleTap).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const clickEvent3 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent3);

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('handles touch events', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onDoubleTap: mockOnDoubleTap }));

    act(() => {
      result.current.current = mockElement;
    });

    const touchEndEvent1 = new TouchEvent('touchend', { bubbles: true });
    mockElement.dispatchEvent(touchEndEvent1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const touchEndEvent2 = new TouchEvent('touchend', { bubbles: true });
    mockElement.dispatchEvent(touchEndEvent2);

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('does not handle taps when disabled', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() =>
      useDoubleTap({ onDoubleTap: mockOnDoubleTap }, { enabled: false })
    );

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent1 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const clickEvent2 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent2);

    expect(mockOnDoubleTap).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', () => {
    const { result, unmount } = renderHook(() => useDoubleTap());

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent);

    unmount();

    act(() => {
      vi.advanceTimersByTime(400);
    });
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');
    const { result, unmount } = renderHook(() => useDoubleTap());

    act(() => {
      result.current.current = mockElement;
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('handles rapid multiple taps', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onDoubleTap: mockOnDoubleTap }));

    act(() => {
      result.current.current = mockElement;
    });

    const clickEvent1 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent1);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const clickEvent2 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent2);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const clickEvent3 = new MouseEvent('click', { bubbles: true });
    mockElement.dispatchEvent(clickEvent3);

    expect(mockOnDoubleTap).toHaveBeenCalled();
  });
});
