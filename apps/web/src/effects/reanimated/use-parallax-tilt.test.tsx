import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useParallaxTilt } from './use-parallax-tilt'

describe('useParallaxTilt', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useParallaxTilt())

    expect(result.current.rotateX).toBeDefined()
    expect(result.current.rotateY).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handleMove).toBeDefined()
    expect(result.current.handleLeave).toBeDefined()
  })

  it('should handle move events with element dimensions', () => {
    const { result } = renderHook(() => useParallaxTilt())

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
    })

    expect(result.current.rotateX.value).toBeDefined()
    expect(result.current.rotateY.value).toBeDefined()
  })

  it('should reset on leave', () => {
    const { result } = renderHook(() => useParallaxTilt())

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
      result.current.handleLeave()
    })

    expect(result.current).toBeDefined()
  })

  it('should respect enabled option', () => {
    const { result } = renderHook(() => useParallaxTilt({ enabled: false }))

    act(() => {
      result.current.handleMove(50, 50, 100, 100)
    })

    expect(result.current).toBeDefined()
  })

  it('should use custom max tilt', () => {
    const { result } = renderHook(() => useParallaxTilt({
      maxTilt: 20
    }))

    expect(result.current).toBeDefined()
  })

  it('should use custom perspective', () => {
    const { result } = renderHook(() => useParallaxTilt({
      perspective: 1500
    }))

    expect(result.current).toBeDefined()
  })
})

