import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useBreathingAnimation } from '../use-breathing-animation'

describe('useBreathingAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBreathingAnimation())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.progress).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useBreathingAnimation({
        minScale: 0.9,
        maxScale: 1.1,
        duration: 2000,
        enabled: true,
        easing: 'cubic',
      })
    )

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.progress).toBeDefined()
  })

  it('should start animation when enabled', async () => {
    const { result } = renderHook(() =>
      useBreathingAnimation({
        enabled: true,
        duration: 1000,
      })
    )

    expect(result.current.progress.value).toBe(0)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.progress.value).toBeGreaterThan(0)
    })
  })

  it('should not animate when disabled', () => {
    const { result } = renderHook(() =>
      useBreathingAnimation({
        enabled: false,
      })
    )

    expect(result.current.progress.value).toBe(0)

    vi.advanceTimersByTime(1000)

    expect(result.current.progress.value).toBe(0)
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useBreathingAnimation())

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should support different easing functions', () => {
    const { result: easeResult } = renderHook(() =>
      useBreathingAnimation({ easing: 'ease' })
    )
    const { result: sineResult } = renderHook(() =>
      useBreathingAnimation({ easing: 'sine' })
    )
    const { result: cubicResult } = renderHook(() =>
      useBreathingAnimation({ easing: 'cubic' })
    )

    expect(easeResult.current.animatedStyle).toBeDefined()
    expect(sineResult.current.animatedStyle).toBeDefined()
    expect(cubicResult.current.animatedStyle).toBeDefined()
  })
})

