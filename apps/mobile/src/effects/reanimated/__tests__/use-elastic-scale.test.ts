import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useElasticScale } from '../use-elastic-scale'

describe('useElasticScale', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default scale', () => {
    const { result } = renderHook(() => useElasticScale())

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should handle press in', async () => {
    const { result } = renderHook(() => useElasticScale())

    result.current.handlePressIn()

    await waitFor(() => {
      expect(result.current.animatedStyle).toBeDefined()
    })
  })

  it('should handle press out', async () => {
    const { result } = renderHook(() => useElasticScale())

    result.current.handlePressIn()
    result.current.handlePressOut()

    await waitFor(() => {
      expect(result.current.animatedStyle).toBeDefined()
    })
  })

  it('should accept custom scale values', () => {
    const { result } = renderHook(() => useElasticScale({ scaleUp: 1.2, scaleDown: 0.9 }))

    expect(result.current.animatedStyle).toBeDefined()
  })
})
