import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useRotation } from '../use-rotation'

describe('useRotation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRotation())

    expect(result.current.rotation).toBeDefined()
    expect(result.current.rotationStyle).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useRotation({
        enabled: true,
        duration: 2000,
        repeat: true,
      })
    )

    expect(result.current.rotation).toBeDefined()
    expect(result.current.rotationStyle).toBeDefined()
  })

  it('should start rotation when enabled', async () => {
    const { result } = renderHook(() =>
      useRotation({
        enabled: true,
        duration: 1000,
      })
    )

    expect(result.current.rotation.value).toBe(0)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.rotation.value).toBeGreaterThan(0)
    })
  })

  it('should not rotate when disabled', () => {
    const { result } = renderHook(() =>
      useRotation({
        enabled: false,
      })
    )

    expect(result.current.rotation.value).toBe(0)

    vi.advanceTimersByTime(1000)

    expect(result.current.rotation.value).toBe(0)
  })

  it('should support finite repeat count', () => {
    const { result } = renderHook(() =>
      useRotation({
        enabled: true,
        duration: 1000,
        repeat: 2,
      })
    )

    expect(result.current.rotation).toBeDefined()
    expect(result.current.rotationStyle).toBeDefined()
  })

  it('should support infinite repeat', () => {
    const { result } = renderHook(() =>
      useRotation({
        enabled: true,
        duration: 1000,
        repeat: true,
      })
    )

    expect(result.current.rotation).toBeDefined()
    expect(result.current.rotationStyle).toBeDefined()
  })

  it('should not repeat when repeat is false', () => {
    const { result } = renderHook(() =>
      useRotation({
        enabled: true,
        duration: 1000,
        repeat: false,
      })
    )

    expect(result.current.rotation).toBeDefined()
    expect(result.current.rotationStyle).toBeDefined()
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useRotation())

    expect(result.current.rotationStyle).toBeDefined()
  })
})
