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

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent1);
      await vi.advanceTimersByTimeAsync(200);
    });

    await act(async () => {
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent2);
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('calls onSingleTap for single tap', async () => {
    const mockOnSingleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onSingleTap: mockOnSingleTap }));

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent);
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(mockOnSingleTap).toHaveBeenCalledTimes(1);
  });

  it('does not call onSingleTap for double tap', async () => {
    const mockOnSingleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onSingleTap: mockOnSingleTap }));

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent1);
      await vi.advanceTimersByTimeAsync(200);
    });

    await act(async () => {
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent2);
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(mockOnSingleTap).not.toHaveBeenCalled();
  });

  it('respects custom delay', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() =>
      useDoubleTap({ onDoubleTap: mockOnDoubleTap }, { delay: 500 })
    );

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent1);
      await vi.advanceTimersByTimeAsync(400);
    });

    await act(async () => {
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent2);
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mockOnDoubleTap).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
      const clickEvent3 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent3);
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('handles touch events', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onDoubleTap: mockOnDoubleTap }));

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const touchEndEvent1 = new TouchEvent('touchend', { bubbles: true });
      mockElement.dispatchEvent(touchEndEvent1);
      await vi.advanceTimersByTimeAsync(200);
    });

    await act(async () => {
      const touchEndEvent2 = new TouchEvent('touchend', { bubbles: true });
      mockElement.dispatchEvent(touchEndEvent2);
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mockOnDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('does not handle taps when disabled', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() =>
      useDoubleTap({ onDoubleTap: mockOnDoubleTap }, { enabled: false })
    );

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent1);
      await vi.advanceTimersByTimeAsync(200);
    });

    await act(async () => {
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent2);
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mockOnDoubleTap).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', async () => {
    const { result, unmount } = renderHook(() => useDoubleTap());

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent);
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
  });

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');
    const { result, unmount } = renderHook(() => useDoubleTap());

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('handles rapid multiple taps', async () => {
    const mockOnDoubleTap = vi.fn();
    const { result } = renderHook(() => useDoubleTap({ onDoubleTap: mockOnDoubleTap }));

    await act(async () => {
      (result.current as { current: HTMLDivElement | null }).current = mockElement;
    });

    await act(async () => {
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent1);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent2);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const clickEvent3 = new MouseEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent3);
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mockOnDoubleTap).toHaveBeenCalled();
  });
});
