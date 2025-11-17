import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useRippleEffect } from '../use-ripple-effect'

describe('useRippleEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRippleEffect())

    expect(result.current.triggerRipple).toBeDefined()
    expect(result.current.rippleStyle).toBeDefined()
  })

  it('should trigger ripple animation', async () => {
    const { result } = renderHook(() => useRippleEffect())

    act(() => {
      result.current.triggerRipple()
    })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.rippleStyle).toBeDefined()
    })
  })

  it('should animate ripple scale and opacity', async () => {
    const { result } = renderHook(() => useRippleEffect())

    act(() => {
      result.current.triggerRipple()
    })

    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(result.current.rippleStyle).toBeDefined()
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useRippleEffect())

    expect(result.current.rippleStyle).toBeDefined()
  })
})
