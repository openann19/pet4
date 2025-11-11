import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGestureSwipe } from '../useGestureSwipe';

// Helper to create TouchEventInit with touches array (polyfill accepts arrays and converts to TouchList)
function createTouchEventInit(touches: Touch[], changedTouches?: Touch[]): TouchEventInit {
  // Polyfill accepts Touch[] arrays and converts them internally
  return {
    touches: touches as unknown as TouchList,
    changedTouches: changedTouches ? (changedTouches as unknown as TouchList) : undefined,
    bubbles: true,
  } as unknown as TouchEventInit;
}

describe('useGestureSwipe', () => {
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
    const { result } = renderHook(() => useGestureSwipe());

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('calls onSwipeStart when touch starts', async () => {
    const mockOnSwipeStart = vi.fn();
    const { result } = renderHook(() => useGestureSwipe({ onSwipeStart: mockOnSwipeStart }));

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch]));

      mockElement.dispatchEvent(touchStartEvent);
    });

    expect(mockOnSwipeStart).toHaveBeenCalledWith(100, 100);
  });

  it('calls onSwipeMove during swipe', async () => {
    const mockOnSwipeMove = vi.fn();
    const { result } = renderHook(() => useGestureSwipe({ onSwipeMove: mockOnSwipeMove }));

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 150,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchMoveEvent = new TouchEvent('touchmove', createTouchEventInit([touch2]));
      mockElement.dispatchEvent(touchMoveEvent);
    });

    expect(mockOnSwipeMove).toHaveBeenCalled();
  });

  it('calls onSwipeUp for upward swipe', async () => {
    const mockOnSwipeUp = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeUp: mockOnSwipeUp }, { threshold: 50 })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 200,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipeUp).toHaveBeenCalled();
  });

  it('calls onSwipeDown for downward swipe', async () => {
    const mockOnSwipeDown = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeDown: mockOnSwipeDown }, { threshold: 50 })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 200,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipeDown).toHaveBeenCalled();
  });

  it('calls onSwipeLeft for leftward swipe', async () => {
    const mockOnSwipeLeft = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeLeft: mockOnSwipeLeft }, { threshold: 50 })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 200,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipeLeft).toHaveBeenCalled();
  });

  it('calls onSwipeRight for rightward swipe', async () => {
    const mockOnSwipeRight = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeRight: mockOnSwipeRight }, { threshold: 50 })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 200,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipeRight).toHaveBeenCalled();
  });

  it('calls onSwipe with direction', async () => {
    const mockOnSwipe = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipe: mockOnSwipe }, { threshold: 50 })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 200,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipe).toHaveBeenCalledWith('up');
  });

  it('calls onSwipeEnd when swipe ends', async () => {
    const mockOnSwipeEnd = vi.fn();
    const { result } = renderHook(() => useGestureSwipe({ onSwipeEnd: mockOnSwipeEnd }));

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipeEnd).toHaveBeenCalled();
  });

  it('respects threshold option', async () => {
    const mockOnSwipe = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipe: mockOnSwipe }, { threshold: 100 })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1]));
      mockElement.dispatchEvent(touchStartEvent);
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      const touch2 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 140,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([], [touch2]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  it('does not handle swipe when disabled', async () => {
    const mockOnSwipeStart = vi.fn();
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeStart: mockOnSwipeStart }, { enabled: false })
    );

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touch = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 100,
        clientY: 100,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    expect(mockOnSwipeStart).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');
    const { result, unmount } = renderHook(() => useGestureSwipe());

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('handles missing touch gracefully', async () => {
    const mockOnSwipeStart = vi.fn();
    const { result } = renderHook(() => useGestureSwipe({ onSwipeStart: mockOnSwipeStart }));

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    expect(mockOnSwipeStart).not.toHaveBeenCalled();
  });
});
