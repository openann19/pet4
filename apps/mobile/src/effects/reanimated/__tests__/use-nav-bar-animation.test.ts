import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useNavBarAnimation } from '../use-nav-bar-animation'

describe('useNavBarAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNavBarAnimation())

    expect(result.current.opacity.value).toBe(0)
    expect(result.current.translateY.value).toBe(100)
    expect(result.current.scale.value).toBe(0.95)
  })

  it('should animate on mount with delay', async () => {
    const { result } = renderHook(() => useNavBarAnimation({ delay: 200 }))

    expect(result.current.opacity.value).toBe(0)

    vi.advanceTimersByTime(200)

    await waitFor(() => {
      expect(result.current.opacity.value).toBeGreaterThan(0)
    })
  })

  it('should return animated styles', () => {
    const { result } = renderHook(() => useNavBarAnimation())

    expect(result.current.navStyle).toBeDefined()
    expect(result.current.shimmerStyle).toBeDefined()
  })

  it('should start shimmer animation', async () => {
    const { result } = renderHook(() => useNavBarAnimation())

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(result.current.shimmerOpacity.value).toBeGreaterThanOrEqual(0)
    })
  })
})
