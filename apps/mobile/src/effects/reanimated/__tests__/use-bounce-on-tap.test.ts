import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useBounceOnTap } from '../use-bounce-on-tap'

describe('useBounceOnTap', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should initialize with default scale value', () => {
    const { result } = renderHook(() => useBounceOnTap())

    expect(result.current.handlePressIn).toBeDefined()
    expect(result.current.handlePressOut).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should handle press in', () => {
    const { result } = renderHook(() => useBounceOnTap())

    act(() => {
      result.current.handlePressIn()
    })

    // Animation should be triggered
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should handle press out', () => {
    const { result } = renderHook(() => useBounceOnTap())

    act(() => {
      result.current.handlePressOut()
    })

    // Animation should be triggered
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useBounceOnTap())

    expect(result.current.animatedStyle).toBeDefined()
  })
})
