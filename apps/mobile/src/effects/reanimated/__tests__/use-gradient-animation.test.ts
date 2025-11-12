import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useGradientAnimation } from '../use-gradient-animation'

describe('useGradientAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGradientAnimation())

    expect(result.current.scale).toBeDefined()
    expect(result.current.opacity).toBeDefined()
    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.rotation).toBeDefined()
    expect(result.current.style).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useGradientAnimation({
        type: 'scale',
        duration: 5,
        opacityRange: [0.5, 0.9],
        scaleRange: [1, 1.5],
      })
    )

    expect(result.current.scale).toBeDefined()
    expect(result.current.opacity).toBeDefined()
  })

  it('should support scale type', () => {
    const { result } = renderHook(() =>
      useGradientAnimation({
        type: 'scale',
        duration: 1,
      })
    )

    expect(result.current.scale).toBeDefined()
    expect(result.current.style).toBeDefined()
  })

  it('should support translate type', () => {
    const { result } = renderHook(() =>
      useGradientAnimation({
        type: 'translate',
        duration: 1,
      })
    )

    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.style).toBeDefined()
  })

  it('should support rotate type', () => {
    const { result } = renderHook(() =>
      useGradientAnimation({
        type: 'rotate',
        duration: 1,
      })
    )

    expect(result.current.rotation).toBeDefined()
    expect(result.current.style).toBeDefined()
  })

  it('should support combined type', () => {
    const { result } = renderHook(() =>
      useGradientAnimation({
        type: 'combined',
        duration: 1,
      })
    )

    expect(result.current.scale).toBeDefined()
    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.rotation).toBeDefined()
    expect(result.current.style).toBeDefined()
  })

  it('should animate values', async () => {
    const { result } = renderHook(() =>
      useGradientAnimation({
        type: 'combined',
        duration: 1,
      })
    )

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.scale.value).not.toBe(1)
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useGradientAnimation())

    expect(result.current.style).toBeDefined()
  })
})
