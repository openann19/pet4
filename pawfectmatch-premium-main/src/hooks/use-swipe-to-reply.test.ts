import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeToReply } from '@/hooks/use-swipe-to-reply'

describe('useSwipeToReply', () => {
  beforeEach(() => {
    // Reset any mocks
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSwipeToReply())

    expect(result.current.translateX.value).toBe(0)
    expect(result.current.opacity.value).toBe(1)
  })

  it('should handle touch start', () => {
    const { result } = renderHook(() => useSwipeToReply())

    const mockEvent = {
      clientX: 100,
      touches: [{ clientX: 100 }]
    } as unknown as React.TouchEvent

    act(() => {
      result.current.handleTouchStart(mockEvent)
    })

    expect(result.current.translateX.value).toBe(0)
  })

  it('should handle touch move', () => {
    const { result } = renderHook(() => useSwipeToReply())

    const startEvent = {
      clientX: 100,
      touches: [{ clientX: 100 }]
    } as unknown as React.TouchEvent

    const moveEvent = {
      clientX: 50,
      touches: [{ clientX: 50 }]
    } as unknown as React.TouchEvent

    act(() => {
      result.current.handleTouchStart(startEvent)
      result.current.handleTouchMove(moveEvent)
    })

    expect(result.current.translateX.value).toBeLessThan(0)
  })

  it('should trigger reply on threshold', () => {
    const onReply = vi.fn()
    const { result } = renderHook(() =>
      useSwipeToReply({ onReply, threshold: 100 })
    )

    const startEvent = {
      clientX: 200,
      touches: [{ clientX: 200 }]
    } as unknown as React.TouchEvent

    act(() => {
      result.current.handleTouchStart(startEvent)
      result.current.translateX.value = -150
      result.current.handleTouchEnd()
    })

    expect(onReply).toHaveBeenCalled()
  })

  it('should snap back if below threshold', () => {
    const onReply = vi.fn()
    const { result } = renderHook(() =>
      useSwipeToReply({ onReply, threshold: 100 })
    )

    act(() => {
      result.current.translateX.value = -50
      result.current.handleTouchEnd()
    })

    expect(onReply).not.toHaveBeenCalled()
    expect(result.current.translateX.value).toBe(0)
  })

  it('should provide animated style', () => {
    const { result } = renderHook(() => useSwipeToReply())

    expect(result.current.animatedStyle).toBeDefined()
  })
})

