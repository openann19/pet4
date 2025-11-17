import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useHeaderAnimation } from '../use-header-animation'

describe('useHeaderAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHeaderAnimation())

    expect(result.current.y.value).toBe(-100)
    expect(result.current.opacity.value).toBe(0)
  })

  it('should animate on mount', async () => {
    const { result } = renderHook(() => useHeaderAnimation({ delay: 0.1 }))

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.y.value).toBeGreaterThan(-100)
    })
  })

  it('should return animated styles', () => {
    const { result } = renderHook(() => useHeaderAnimation())

    expect(result.current.headerStyle).toBeDefined()
    expect(result.current.shimmerStyle).toBeDefined()
  })
})
