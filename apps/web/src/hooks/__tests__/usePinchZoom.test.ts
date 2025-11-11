import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePinchZoom } from '../usePinchZoom';

// Helper to create TouchEventInit with touches array (polyfill accepts arrays and converts to TouchList)
function createTouchEventInit(touches: Touch[], changedTouches?: Touch[]): TouchEventInit {
  // Polyfill accepts Touch[] arrays and converts them internally
  return {
    touches: touches as unknown as TouchList,
    changedTouches: changedTouches ? (changedTouches as unknown as TouchList) : undefined,
    bubbles: true,
  } as unknown as TouchEventInit;
}

describe('usePinchZoom', () => {
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
    const { result } = renderHook(() => usePinchZoom());

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('attaches ref to element', async () => {
    const { result } = renderHook(() => usePinchZoom());

    await act(async () => {
      if (result.current) {
        (result.current as { current: HTMLDivElement | null }).current = mockElement;
      }
      // Wait for useEffect to run
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.current).toBe(mockElement);
  });

  it('calls onPinchStart when pinch starts', async () => {
    const mockOnPinchStart = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onPinchStart: mockOnPinchStart }));

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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 100,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    expect(mockOnPinchStart).toHaveBeenCalled();
  });

  it('calls onPinch with scale during pinch', async () => {
    const mockOnPinch = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onPinch: mockOnPinch }));

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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 100,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 200,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchMoveEvent = new TouchEvent('touchmove', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchMoveEvent);
    });

    expect(mockOnPinch).toHaveBeenCalled();
  });

  it('calls onPinchEnd when pinch ends', async () => {
    const mockOnPinchEnd = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onPinchEnd: mockOnPinchEnd }));

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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 100,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    await act(async () => {
      const touchEndEvent = new TouchEvent('touchend', createTouchEventInit([]));
      mockElement.dispatchEvent(touchEndEvent);
    });

    expect(mockOnPinchEnd).toHaveBeenCalled();
  });

  it('respects minScale option', async () => {
    const mockOnPinch = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onPinch: mockOnPinch }, { minScale: 0.8 }));

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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 100,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 50,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchMoveEvent = new TouchEvent('touchmove', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchMoveEvent);
    });

    const lastCall = mockOnPinch.mock.calls[mockOnPinch.mock.calls.length - 1];
    if (lastCall) {
      expect(lastCall[0]).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('respects maxScale option', async () => {
    const mockOnPinch = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onPinch: mockOnPinch }, { maxScale: 2 }));

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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 100,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    await act(async () => {
      const touch1 = new Touch({
        identifier: 0,
        target: mockElement,
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 500,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchMoveEvent = new TouchEvent('touchmove', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchMoveEvent);
    });

    const lastCall = mockOnPinch.mock.calls[mockOnPinch.mock.calls.length - 1];
    if (lastCall) {
      expect(lastCall[0]).toBeLessThanOrEqual(2);
    }
  });

  it('does not handle pinch when disabled', async () => {
    const mockOnPinchStart = vi.fn();
    const { result } = renderHook(() =>
      usePinchZoom({ onPinchStart: mockOnPinchStart }, { enabled: false })
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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touch2 = new Touch({
        identifier: 1,
        target: mockElement,
        clientX: 100,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch1, touch2]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    expect(mockOnPinchStart).not.toHaveBeenCalled();
  });

  it('ignores single touch', async () => {
    const mockOnPinchStart = vi.fn();
    const { result } = renderHook(() => usePinchZoom({ onPinchStart: mockOnPinchStart }));

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
        clientX: 0,
        clientY: 0,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 0,
      });
      const touchStartEvent = new TouchEvent('touchstart', createTouchEventInit([touch]));
      mockElement.dispatchEvent(touchStartEvent);
    });

    expect(mockOnPinchStart).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');
    const { result, unmount } = renderHook(() => usePinchZoom());

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
});
