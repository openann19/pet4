import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBounceOnTap } from './use-bounce-on-tap'
import { haptics } from '@/lib/haptics'

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn()
  }
}))

describe('useBounceOnTap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBounceOnTap())

    expect(result.current.scale.value).toBe(1)
    expect(result.current.handlePress).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should call haptic feedback on press by default', () => {
    const { result } = renderHook(() => useBounceOnTap())

    act(() => {
      result.current.handlePress()
    })

    expect(haptics.impact).toHaveBeenCalledWith('light')
  })

  it('should not call haptic feedback when disabled', () => {
    const { result } = renderHook(() => useBounceOnTap({
      hapticFeedback: false
    }))

    act(() => {
      result.current.handlePress()
    })

    expect(haptics.impact).not.toHaveBeenCalled()
  })

  it('should call onPress callback when provided', () => {
    const onPress = vi.fn()
    const { result } = renderHook(() => useBounceOnTap({ onPress }))

    act(() => {
      result.current.handlePress()
    })

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('should use custom scale value', () => {
    const { result } = renderHook(() => useBounceOnTap({
      scale: 0.9
    }))

    act(() => {
      result.current.handlePress()
    })

    expect(result.current.scale.value).toBeLessThan(1)
  })

  it('should use custom spring config', () => {
    const { result } = renderHook(() => useBounceOnTap({
      damping: 20,
      stiffness: 500
    }))

    expect(result.current).toBeDefined()
  })
})

