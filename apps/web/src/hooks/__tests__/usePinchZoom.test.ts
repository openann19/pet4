import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePinchZoom } from '../usePinchZoom'
import { isTruthy, isDefined } from '@/core/guards';

describe('usePinchZoom', () => {
  let mockElement: HTMLDivElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    document.body.removeChild(mockElement)
  })

  it('returns ref', () => {
    const { result } = renderHook(() => usePinchZoom())

    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('attaches ref to element', () => {
    const { result } = renderHook(() => usePinchZoom())

    act(() => {
      if (result.current.current === null) {
        result.current.current = mockElement
      }
    })

    expect(result.current.current).toBe(mockElement)
  })

  it('calls onPinchStart when pinch starts', () => {
    const mockOnPinchStart = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinchStart: mockOnPinchStart })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 100, clientY: 0 } as Touch,
      ],
    })

    mockElement.dispatchEvent(touchStartEvent)

    expect(mockOnPinchStart).toHaveBeenCalled()
  })

  it('calls onPinch with scale during pinch', () => {
    const mockOnPinch = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinch: mockOnPinch })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 100, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchStartEvent)

    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 200, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchMoveEvent)

    expect(mockOnPinch).toHaveBeenCalled()
  })

  it('calls onPinchEnd when pinch ends', () => {
    const mockOnPinchEnd = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinchEnd: mockOnPinchEnd })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 100, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchStartEvent)

    const touchEndEvent = new TouchEvent('touchend')
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnPinchEnd).toHaveBeenCalled()
  })

  it('respects minScale option', () => {
    const mockOnPinch = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinch: mockOnPinch }, { minScale: 0.8 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 100, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchStartEvent)

    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 50, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchMoveEvent)

    const lastCall = mockOnPinch.mock.calls[mockOnPinch.mock.calls.length - 1]
    if (isTruthy(lastCall)) {
      expect(lastCall[0]).toBeGreaterThanOrEqual(0.8)
    }
  })

  it('respects maxScale option', () => {
    const mockOnPinch = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinch: mockOnPinch }, { maxScale: 2 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 100, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchStartEvent)

    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 500, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchMoveEvent)

    const lastCall = mockOnPinch.mock.calls[mockOnPinch.mock.calls.length - 1]
    if (isTruthy(lastCall)) {
      expect(lastCall[0]).toBeLessThanOrEqual(2)
    }
  })

  it('does not handle pinch when disabled', () => {
    const mockOnPinchStart = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinchStart: mockOnPinchStart }, { enabled: false })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 0, clientY: 0 } as Touch,
        { clientX: 100, clientY: 0 } as Touch,
      ],
    })
    mockElement.dispatchEvent(touchStartEvent)

    expect(mockOnPinchStart).not.toHaveBeenCalled()
  })

  it('ignores single touch', () => {
    const mockOnPinchStart = vi.fn()
    const { result } = renderHook(() =>
      usePinchZoom({ onPinchStart: mockOnPinchStart })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 0, clientY: 0 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    expect(mockOnPinchStart).not.toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener')
    const { result, unmount } = renderHook(() => usePinchZoom())

    act(() => {
      result.current.current = mockElement
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()
    removeEventListenerSpy.mockRestore()
  })
})

