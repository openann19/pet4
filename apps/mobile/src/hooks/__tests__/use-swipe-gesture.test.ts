/**
 * Swipe Gesture Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-swipe-gesture.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useSwipeGesture } from '../use-swipe-gesture'

describe('useSwipeGesture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSwipeGesture())

    expect(result.current.isSwiping).toBe(false)
    expect(result.current.swipeDistance).toBe(0)
    expect(result.current.ref).toBeDefined()
    expect(result.current.handlers).toBeDefined()
    expect(typeof result.current.handlers.onTouchStart).toBe('function')
    expect(typeof result.current.handlers.onTouchMove).toBe('function')
    expect(typeof result.current.handlers.onTouchEnd).toBe('function')
    expect(typeof result.current.handlers.onMouseDown).toBe('function')
    expect(typeof result.current.handlers.onMouseMove).toBe('function')
    expect(typeof result.current.handlers.onMouseUp).toBe('function')
  })

  describe('touch handlers', () => {
    it('should detect swipe right', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeRight,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(result.current.isSwiping).toBe(true)

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 100, clientY: 10 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(result.current.swipeDistance).toBe(100)

      act(() => {
        result.current.handlers.onTouchEnd({
          changedTouches: [{ clientX: 100 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(onSwipeRight).toHaveBeenCalled()
      expect(result.current.isSwiping).toBe(false)
      expect(result.current.swipeDistance).toBe(0)
    })

    it('should detect swipe left', () => {
      const onSwipeLeft = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 0, clientY: 10 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchEnd({
          changedTouches: [{ clientX: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(onSwipeLeft).toHaveBeenCalled()
    })

    it('should not trigger swipe if distance is below threshold', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeRight,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 30, clientY: 10 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchEnd({
          changedTouches: [{ clientX: 30 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('should handle vertical swipe without triggering callbacks', () => {
      const onSwipeRight = vi.fn()
      const onSwipeLeft = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeRight,
          onSwipeLeft,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 10, clientY: 100 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchEnd({
          changedTouches: [{ clientX: 10 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(onSwipeRight).not.toHaveBeenCalled()
      expect(onSwipeLeft).not.toHaveBeenCalled()
    })
  })

  describe('mouse handlers', () => {
    it('should detect swipe right with mouse', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeRight,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 0,
          clientY: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent)
      })

      expect(result.current.isSwiping).toBe(true)

      act(() => {
        result.current.handlers.onMouseMove({
          clientX: 100,
          clientY: 10,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent)
      })

      expect(result.current.swipeDistance).toBe(100)

      act(() => {
        result.current.handlers.onMouseUp({
          clientX: 100,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent)
      })

      expect(onSwipeRight).toHaveBeenCalled()
      expect(result.current.isSwiping).toBe(false)
    })

    it('should detect swipe left with mouse', () => {
      const onSwipeLeft = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
          clientY: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent)
      })

      act(() => {
        result.current.handlers.onMouseMove({
          clientX: 0,
          clientY: 10,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent)
      })

      act(() => {
        result.current.handlers.onMouseUp({
          clientX: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent)
      })

      expect(onSwipeLeft).toHaveBeenCalled()
    })
  })

  describe('preventDefault', () => {
    it('should prevent default when preventDefault is true', () => {
      const preventDefault = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          preventDefault: true,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault,
        } as unknown as React.TouchEvent)
      })

      expect(preventDefault).toHaveBeenCalled()
    })

    it('should not prevent default when preventDefault is false', () => {
      const preventDefault = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          preventDefault: false,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault,
        } as unknown as React.TouchEvent)
      })

      expect(preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('custom threshold', () => {
    it('should use custom threshold', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeRight,
          threshold: 100,
        })
      )

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 80, clientY: 10 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchEnd({
          changedTouches: [{ clientX: 80 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(onSwipeRight).not.toHaveBeenCalled()

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 0, clientY: 0 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 120, clientY: 10 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.handlers.onTouchEnd({
          changedTouches: [{ clientX: 120 }],
          preventDefault: vi.fn(),
        } as unknown as React.TouchEvent)
      })

      expect(onSwipeRight).toHaveBeenCalled()
    })
  })
})
