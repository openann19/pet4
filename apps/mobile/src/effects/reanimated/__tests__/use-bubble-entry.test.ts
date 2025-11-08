import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useBubbleEntry } from '../use-bubble-entry'

describe('useBubbleEntry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values for new messages', () => {
    const { result } = renderHook(() => useBubbleEntry({ isNew: true, enabled: true }))

    expect(result.current.opacity.value).toBe(0)
    expect(result.current.translateY.value).toBe(20)
  })

  it('should initialize with visible values for existing messages', () => {
    const { result } = renderHook(() => useBubbleEntry({ isNew: false, enabled: true }))

    expect(result.current.opacity.value).toBe(1)
    expect(result.current.translateY.value).toBe(0)
  })

  it('should animate incoming messages from left', async () => {
    const { result } = renderHook(() =>
      useBubbleEntry({
        direction: 'incoming',
        isNew: true,
        enabled: true,
        index: 0,
      })
    )

    expect(result.current.translateX.value).toBe(-30)

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.translateX.value).toBeGreaterThan(-30)
    })
  })

  it('should animate outgoing messages from right', async () => {
    const { result } = renderHook(() =>
      useBubbleEntry({
        direction: 'outgoing',
        isNew: true,
        enabled: true,
        index: 0,
      })
    )

    expect(result.current.translateX.value).toBe(30)

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.translateX.value).toBeLessThan(30)
    })
  })

  it('should stagger animations based on index', async () => {
    const { result: result0 } = renderHook(() =>
      useBubbleEntry({ index: 0, isNew: true, enabled: true, staggerDelay: 40 })
    )
    const { result: result1 } = renderHook(() =>
      useBubbleEntry({ index: 1, isNew: true, enabled: true, staggerDelay: 40 })
    )

    expect(result0.current.opacity.value).toBe(0)
    expect(result1.current.opacity.value).toBe(0)

    vi.advanceTimersByTime(50)

    await waitFor(() => {
      expect(result0.current.opacity.value).toBeGreaterThan(result1.current.opacity.value)
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useBubbleEntry())

    expect(result.current.animatedStyle).toBeDefined()
  })
})
