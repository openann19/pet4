import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useMagneticEffect } from '../use-magnetic-effect'

describe('useMagneticEffect', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMagneticEffect())

    expect(result.current.translateX).toBeDefined()
    expect(result.current.translateY).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handleMove).toBeDefined()
    expect(result.current.handleLeave).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useMagneticEffect({
        strength: 30,
        damping: 20,
        stiffness: 200,
        enabled: true,
      })
    )

    expect(result.current.translateX).toBeDefined()
    expect(result.current.translateY).toBeDefined()
  })

  it('should handle move', () => {
    const { result } = renderHook(() => useMagneticEffect())

    act(() => {
      result.current.handleMove(50, 50)
    })

    // Animation should be triggered
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should handle leave', () => {
    const { result } = renderHook(() => useMagneticEffect())

    act(() => {
      result.current.handleMove(50, 50)
      result.current.handleLeave()
    })

    // Animation should reset
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should not respond to moves when disabled', () => {
    const { result } = renderHook(() =>
      useMagneticEffect({
        enabled: false,
      })
    )

    act(() => {
      result.current.handleMove(50, 50)
    })

    // Should not animate when disabled
    expect(result.current.translateX.value).toBe(0)
    expect(result.current.translateY.value).toBe(0)
  })

  it('should not respond to leave when disabled', () => {
    const { result } = renderHook(() =>
      useMagneticEffect({
        enabled: false,
      })
    )

    act(() => {
      result.current.handleLeave()
    })

    // Should not animate when disabled
    expect(result.current.translateX.value).toBe(0)
    expect(result.current.translateY.value).toBe(0)
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useMagneticEffect())

    expect(result.current.animatedStyle).toBeDefined()
  })
})
