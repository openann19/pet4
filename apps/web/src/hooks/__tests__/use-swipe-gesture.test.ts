import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSwipeGesture } from '../use-swipe-gesture'

describe('useSwipeGesture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSwipeGesture())

      expect(result.current.isSwiping).toBe(false)
      expect(result.current.swipeDistance).toBe(0)
      expect(result.current.handlers).toBeDefined()
      expect(result.current.ref).toBeDefined()
    })

    it('should initialize with custom threshold', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ threshold: 100 })
      )

      expect(result.current.isSwiping).toBe(false)
      expect(result.current.swipeDistance).toBe(0)
    })
  })

  describe('Touch Events', () => {
    it('should handle touch start', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const mockEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(mockEvent)
      })

      expect(result.current.isSwiping).toBe(true)
    })

    it('should handle touch move', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const startEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      const moveEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 150, clientY: 200 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(startEvent)
        result.current.handlers.onTouchMove(moveEvent)
      })

      expect(result.current.swipeDistance).toBe(50)
    })

    it('should trigger swipe right callback', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeRight, threshold: 50 })
      )

      const startEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      const moveEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 200, clientY: 200 }]
      } as unknown as React.TouchEvent

      const endEvent = {
        preventDefault: vi.fn(),
        changedTouches: [{ clientX: 200 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(startEvent)
        result.current.handlers.onTouchMove(moveEvent)
        result.current.handlers.onTouchEnd(endEvent)
      })

      expect(onSwipeRight).toHaveBeenCalledTimes(1)
      expect(result.current.isSwiping).toBe(false)
    })

    it('should trigger swipe left callback', () => {
      const onSwipeLeft = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, threshold: 50 })
      )

      const startEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 200, clientY: 200 }]
      } as unknown as React.TouchEvent

      const moveEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      const endEvent = {
        preventDefault: vi.fn(),
        changedTouches: [{ clientX: 100 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(startEvent)
        result.current.handlers.onTouchMove(moveEvent)
        result.current.handlers.onTouchEnd(endEvent)
      })

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
      expect(result.current.isSwiping).toBe(false)
    })

    it('should not trigger callback if threshold not met', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeRight, threshold: 100 })
      )

      const startEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      const endEvent = {
        preventDefault: vi.fn(),
        changedTouches: [{ clientX: 130 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(startEvent)
        result.current.handlers.onTouchEnd(endEvent)
      })

      expect(onSwipeRight).not.toHaveBeenCalled()
    })
  })

  describe('Mouse Events', () => {
    it('should handle mouse down', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200
      } as unknown as React.MouseEvent

      act(() => {
        result.current.handlers.onMouseDown(mockEvent)
      })

      expect(result.current.isSwiping).toBe(true)
    })

    it('should handle mouse move', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const startEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200
      } as unknown as React.MouseEvent

      const moveEvent = {
        preventDefault: vi.fn(),
        clientX: 150,
        clientY: 200
      } as unknown as React.MouseEvent

      act(() => {
        result.current.handlers.onMouseDown(startEvent)
        result.current.handlers.onMouseMove(moveEvent)
      })

      expect(result.current.swipeDistance).toBe(50)
    })

    it('should trigger swipe right callback on mouse', () => {
      const onSwipeRight = vi.fn()
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeRight, threshold: 50 })
      )

      const startEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200
      } as unknown as React.MouseEvent

      const moveEvent = {
        preventDefault: vi.fn(),
        clientX: 200,
        clientY: 200
      } as unknown as React.MouseEvent

      const endEvent = {
        preventDefault: vi.fn(),
        clientX: 200
      } as unknown as React.MouseEvent

      act(() => {
        result.current.handlers.onMouseDown(startEvent)
        result.current.handlers.onMouseMove(moveEvent)
        result.current.handlers.onMouseUp(endEvent)
      })

      expect(onSwipeRight).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing touch in touch start', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const mockEvent = {
        preventDefault: vi.fn(),
        touches: []
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(mockEvent)
      })

      expect(result.current.isSwiping).toBe(false)
    })

    it('should handle missing changed touch in touch end', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const startEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      const endEvent = {
        preventDefault: vi.fn(),
        changedTouches: []
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(startEvent)
        result.current.handlers.onTouchEnd(endEvent)
      })

      expect(result.current.isSwiping).toBe(true)
    })

    it('should not prevent default when preventDefault is false', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ preventDefault: false })
      )
      const preventDefault = vi.fn()
      const mockEvent = {
        preventDefault,
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(mockEvent)
      })

      expect(preventDefault).not.toHaveBeenCalled()
    })

    it('should prioritize horizontal swipe over vertical', () => {
      const { result } = renderHook(() => useSwipeGesture())
      const startEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      } as unknown as React.TouchEvent

      const moveEvent = {
        preventDefault: vi.fn(),
        touches: [{ clientX: 150, clientY: 210 }]
      } as unknown as React.TouchEvent

      act(() => {
        result.current.handlers.onTouchStart(startEvent)
        result.current.handlers.onTouchMove(moveEvent)
      })

      expect(result.current.swipeDistance).toBe(50)
    })
  })
})

