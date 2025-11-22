import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useEntryAnimation } from '../use-entry-animation'

describe('useEntryAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEntryAnimation())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.opacity).toBeDefined()
    expect(result.current.translateY).toBeDefined()
    expect(result.current.scale).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useEntryAnimation({
        delay: 100,
        initialY: 30,
        initialOpacity: 0.5,
        initialScale: 0.9,
        enabled: true,
      })
    )

    expect(result.current.opacity.value).toBe(0.5)
    expect(result.current.translateY.value).toBe(30)
    expect(result.current.scale.value).toBe(0.9)
  })

  it('should animate on mount when enabled', async () => {
    const { result } = renderHook(() =>
      useEntryAnimation({
        enabled: true,
        delay: 0,
      })
    )

    expect(result.current.opacity.value).toBe(0)
    expect(result.current.translateY.value).toBe(20)
    expect(result.current.scale.value).toBe(0.95)

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })
  })

  it('should not animate when disabled', () => {
    const { result } = renderHook(() =>
      useEntryAnimation({
        enabled: false,
      })
    )

    expect(result.current.opacity.value).toBe(1)
    expect(result.current.translateY.value).toBe(0)
    expect(result.current.scale.value).toBe(1)
  })

  it('should respect delay option', async () => {
    const { result } = renderHook(() =>
      useEntryAnimation({
        delay: 500,
        enabled: true,
      })
    )

    expect(result.current.opacity.value).toBe(0)

    vi.advanceTimersByTime(400)

    expect(result.current.opacity.value).toBe(0)

    vi.advanceTimersByTime(200)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useEntryAnimation())

    expect(result.current.animatedStyle).toBeDefined()
  })
})
