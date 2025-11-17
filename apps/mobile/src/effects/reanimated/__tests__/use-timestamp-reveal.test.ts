import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useTimestampReveal } from '../use-timestamp-reveal'

describe('useTimestampReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTimestampReveal())

    expect(result.current.opacity).toBeDefined()
    expect(result.current.translateY).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.show).toBeDefined()
    expect(result.current.hide).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useTimestampReveal({
        autoHideDelay: 5000,
        enabled: true,
      })
    )

    expect(result.current.opacity).toBeDefined()
    expect(result.current.translateY).toBeDefined()
  })

  it('should show timestamp', async () => {
    const { result } = renderHook(() => useTimestampReveal())

    expect(result.current.opacity.value).toBe(0)

    act(() => {
      result.current.show()
    })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })
  })

  it('should hide timestamp after autoHideDelay', async () => {
    const { result } = renderHook(() =>
      useTimestampReveal({
        autoHideDelay: 1000,
      })
    )

    act(() => {
      result.current.show()
    })

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })

    vi.advanceTimersByTime(600)

    await waitFor(() => {
      expect(result.current.opacity.value).toBe(0)
    })
  })

  it('should hide timestamp manually', async () => {
    const { result } = renderHook(() => useTimestampReveal())

    act(() => {
      result.current.show()
    })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })

    act(() => {
      result.current.hide()
    })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.opacity.value).toBe(0)
    })
  })

  it('should not show when disabled', () => {
    const { result } = renderHook(() =>
      useTimestampReveal({
        enabled: false,
      })
    )

    act(() => {
      result.current.show()
    })

    expect(result.current.opacity.value).toBe(0)
  })

  it('should cancel auto-hide when show is called again', async () => {
    const { result } = renderHook(() =>
      useTimestampReveal({
        autoHideDelay: 1000,
      })
    )

    act(() => {
      result.current.show()
    })

    vi.advanceTimersByTime(500)

    act(() => {
      result.current.show()
    })

    vi.advanceTimersByTime(600)

    // Should still be visible because show was called again
    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useTimestampReveal())

    expect(result.current.animatedStyle).toBeDefined()
  })
})
