import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useFloatingParticle } from '../use-floating-particle'

describe('useFloatingParticle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFloatingParticle())

    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.opacity).toBeDefined()
    expect(result.current.scale).toBeDefined()
    expect(result.current.style).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useFloatingParticle({
        initialX: 100,
        initialY: 200,
        width: 800,
        height: 600,
        duration: 20,
        opacity: 0.8,
      })
    )

    expect(result.current.x.value).toBe(100)
    expect(result.current.y.value).toBe(200)
  })

  it('should animate particle movement', async () => {
    const { result } = renderHook(() => useFloatingParticle({ duration: 1 }))

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.x.value).not.toBe(0)
    })
  })

  it('should animate opacity', async () => {
    const { result } = renderHook(() => useFloatingParticle({ duration: 1 }))

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })
  })

  it('should animate scale', async () => {
    const { result } = renderHook(() => useFloatingParticle({ duration: 1 }))

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.scale.value).toBeGreaterThan(0)
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useFloatingParticle())

    expect(result.current.style).toBeDefined()
  })
})
