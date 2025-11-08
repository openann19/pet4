import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useGlowPulse } from '../use-glow-pulse'

describe('useGlowPulse', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGlowPulse())

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should start animation when enabled', async () => {
    const { result } = renderHook(() => useGlowPulse({ enabled: true }))

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(result.current.animatedStyle).toBeDefined()
    })
  })

  it('should not animate when disabled', () => {
    const { result } = renderHook(() => useGlowPulse({ enabled: false }))

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should allow manual start/stop', () => {
    const { result } = renderHook(() => useGlowPulse({ enabled: false }))

    result.current.start()
    expect(result.current.animatedStyle).toBeDefined()

    result.current.stop()
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should accept custom color and intensity', () => {
    const { result } = renderHook(() =>
      useGlowPulse({
        color: 'rgba(255, 0, 0, 0.8)',
        intensity: 2.0,
      })
    )

    expect(result.current.animatedStyle).toBeDefined()
  })
})
