import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGestureSwipe } from '../useGestureSwipe'

describe('useGestureSwipe', () => {
  let mockElement: HTMLDivElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    document.body.appendChild(mockElement)
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.removeChild(mockElement)
    vi.useRealTimers()
  })

  it('returns ref', () => {
    const { result } = renderHook(() => useGestureSwipe())

    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('calls onSwipeStart when touch starts', () => {
    const mockOnSwipeStart = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeStart: mockOnSwipeStart })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })

    mockElement.dispatchEvent(touchStartEvent)

    expect(mockOnSwipeStart).toHaveBeenCalledWith(100, 100)
  })

  it('calls onSwipeMove during swipe', () => {
    const mockOnSwipeMove = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeMove: mockOnSwipeMove })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchMoveEvent)

    expect(mockOnSwipeMove).toHaveBeenCalled()
  })

  it('calls onSwipeUp for upward swipe', () => {
    const mockOnSwipeUp = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeUp: mockOnSwipeUp }, { threshold: 50 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 200 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipeUp).toHaveBeenCalled()
  })

  it('calls onSwipeDown for downward swipe', () => {
    const mockOnSwipeDown = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeDown: mockOnSwipeDown }, { threshold: 50 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 200 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipeDown).toHaveBeenCalled()
  })

  it('calls onSwipeLeft for leftward swipe', () => {
    const mockOnSwipeLeft = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeLeft: mockOnSwipeLeft }, { threshold: 50 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipeLeft).toHaveBeenCalled()
  })

  it('calls onSwipeRight for rightward swipe', () => {
    const mockOnSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeRight: mockOnSwipeRight }, { threshold: 50 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipeRight).toHaveBeenCalled()
  })

  it('calls onSwipe with direction', () => {
    const mockOnSwipe = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipe: mockOnSwipe }, { threshold: 50 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 200 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipe).toHaveBeenCalledWith('up')
  })

  it('calls onSwipeEnd when swipe ends', () => {
    const mockOnSwipeEnd = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeEnd: mockOnSwipeEnd })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipeEnd).toHaveBeenCalled()
  })

  it('respects threshold option', () => {
    const mockOnSwipe = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipe: mockOnSwipe }, { threshold: 100 })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 140, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchEndEvent)

    expect(mockOnSwipe).not.toHaveBeenCalled()
  })

  it('does not handle swipe when disabled', () => {
    const mockOnSwipeStart = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeStart: mockOnSwipeStart }, { enabled: false })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    mockElement.dispatchEvent(touchStartEvent)

    expect(mockOnSwipeStart).not.toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener')
    const { result, unmount } = renderHook(() => useGestureSwipe())

    act(() => {
      result.current.current = mockElement
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()
    removeEventListenerSpy.mockRestore()
  })

  it('handles missing touch gracefully', () => {
    const mockOnSwipeStart = vi.fn()
    const { result } = renderHook(() =>
      useGestureSwipe({ onSwipeStart: mockOnSwipeStart })
    )

    act(() => {
      result.current.current = mockElement
    })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [],
    })
    mockElement.dispatchEvent(touchStartEvent)

    expect(mockOnSwipeStart).not.toHaveBeenCalled()
  })
})

