import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndoSendAnimation } from './use-undo-send-animation'

describe('useUndoSendAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUndoSendAnimation())

    expect(result.current.translateX.value).toBe(0)
    expect(result.current.scale.value).toBe(1)
    expect(result.current.opacity.value).toBe(1)
  })

  it('should animate undo send', () => {
    const { result } = renderHook(() => useUndoSendAnimation())

    act(() => {
      result.current.animate()
    })

    expect(result.current.translateX.value).toBeLessThan(0)
    expect(result.current.scale.value).toBeLessThan(1)
    expect(result.current.opacity.value).toBeLessThan(1)
  })

  it('should call onComplete callback', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useUndoSendAnimation({ onComplete })
    )

    act(() => {
      result.current.animate()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onComplete).toHaveBeenCalled()
  })

  it('should reset animation', () => {
    const { result } = renderHook(() => useUndoSendAnimation())

    act(() => {
      result.current.animate()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.translateX.value).toBe(0)
    expect(result.current.scale.value).toBe(1)
    expect(result.current.opacity.value).toBe(1)
  })

  it('should provide animated style', () => {
    const { result } = renderHook(() => useUndoSendAnimation())

    expect(result.current.animatedStyle).toBeDefined()
  })
})

