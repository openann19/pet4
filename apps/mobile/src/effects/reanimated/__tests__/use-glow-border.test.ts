import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useGlowBorder } from '../use-glow-border'

describe('useGlowBorder', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGlowBorder())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.progress).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useGlowBorder({
        color: 'rgba(255, 0, 0, 0.8)',
        intensity: 30,
        speed: 3000,
        enabled: true,
      })
    )

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.progress).toBeDefined()
  })

  it('should start animation when enabled', async () => {
    const { result } = renderHook(() =>
      useGlowBorder({
        enabled: true,
        speed: 1000,
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
      useGlowBorder({
        enabled: false,
      })
    )

    expect(result.current.progress.value).toBe(0)

    vi.advanceTimersByTime(1000)

    expect(result.current.progress.value).toBe(0)
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useGlowBorder())

    expect(result.current.animatedStyle).toBeDefined()
  })
})

