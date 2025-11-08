import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useShimmer } from '../use-shimmer'

describe('useShimmer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useShimmer())

    expect(result.current.translateX.value).toBe(-200)
    expect(result.current.opacity.value).toBe(0.3)
  })

  it('should start animation when enabled', async () => {
    const { result } = renderHook(() => useShimmer({ enabled: true }))

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.animatedStyle).toBeDefined()
    })
  })

  it('should not start animation when disabled', () => {
    const { result } = renderHook(() => useShimmer({ enabled: false }))

    expect(result.current.translateX.value).toBe(-200)
    expect(result.current.opacity.value).toBe(0.3)
  })

  it('should allow manual start/stop', () => {
    const { result } = renderHook(() => useShimmer({ enabled: false }))

    result.current.start()
    expect(result.current.animatedStyle).toBeDefined()

    result.current.stop()
    expect(result.current.translateX.value).toBe(-200)
    expect(result.current.opacity.value).toBe(0.3)
  })

  it('should accept custom duration and width', () => {
    const { result } = renderHook(() => useShimmer({ duration: 3000, shimmerWidth: 300 }))

    expect(result.current.translateX.value).toBe(-300)
  })
})
