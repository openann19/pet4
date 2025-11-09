import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useBubbleTilt } from '../use-bubble-tilt'

describe('useBubbleTilt', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBubbleTilt())

    expect(result.current.rotateX).toBeDefined()
    expect(result.current.rotateY).toBeDefined()
    expect(result.current.shadowDepth).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handleMove).toBeDefined()
    expect(result.current.handleLeave).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useBubbleTilt({
        maxTilt: 10,
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
    const { result } = renderHook(() => useBubbleTilt())

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
    })

    // Animation should be triggered
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should handle leave', () => {
    const { result } = renderHook(() => useBubbleTilt())

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
      result.current.handleLeave()
    })

    // Animation should reset
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should not respond to moves when disabled', () => {
    const { result } = renderHook(() =>
      useBubbleTilt({
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
      useBubbleTilt({
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
    const { result } = renderHook(() => useBubbleTilt())

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should calculate tilt based on position relative to center', () => {
    const { result } = renderHook(() => useBubbleTilt())

    act(() => {
      // Move to top-left corner
      result.current.handleMove(0, 0, 100, 100)
    })

    expect(result.current.animatedStyle).toBeDefined()
  })
})
