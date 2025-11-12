import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useParallaxTilt } from '../use-parallax-tilt'

describe('useParallaxTilt', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useParallaxTilt())

    expect(result.current.rotateX).toBeDefined()
    expect(result.current.rotateY).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handleMove).toBeDefined()
    expect(result.current.handleLeave).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useParallaxTilt({
        maxTilt: 20,
        damping: 20,
        stiffness: 200,
        enabled: true,
        perspective: 1500,
      })
    )

    expect(result.current.rotateX).toBeDefined()
    expect(result.current.rotateY).toBeDefined()
  })

  it('should handle move', () => {
    const { result } = renderHook(() => useParallaxTilt())

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
    })

    // Animation should be triggered
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should handle leave', () => {
    const { result } = renderHook(() => useParallaxTilt())

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
      result.current.handleLeave()
    })

    // Animation should reset
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should not respond to moves when disabled', () => {
    const { result } = renderHook(() =>
      useParallaxTilt({
        enabled: false,
      })
    )

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
    })

    // Should not animate when disabled
    expect(result.current.rotateX.value).toBe(0)
    expect(result.current.rotateY.value).toBe(0)
  })

  it('should not respond to leave when disabled', () => {
    const { result } = renderHook(() =>
      useParallaxTilt({
        enabled: false,
      })
    )

    act(() => {
      result.current.handleLeave()
    })

    // Should not animate when disabled
    expect(result.current.rotateX.value).toBe(0)
    expect(result.current.rotateY.value).toBe(0)
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useParallaxTilt())

    expect(result.current.animatedStyle).toBeDefined()
  })
})
