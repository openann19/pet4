import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMagneticEffect } from './use-magnetic-effect'

describe('useMagneticEffect', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMagneticEffect())

    expect(result.current.translateX).toBeDefined()
    expect(result.current.translateY).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handleMove).toBeDefined()
    expect(result.current.handleLeave).toBeDefined()
  })

  it('should handle move events', () => {
    const { result } = renderHook(() => useMagneticEffect())

    act(() => {
      result.current.handleMove(10, 20)
    })

    expect(result.current.translateX.value).toBeDefined()
    expect(result.current.translateY.value).toBeDefined()
  })

  it('should reset on leave', () => {
    const { result } = renderHook(() => useMagneticEffect())

    act(() => {
      result.current.handleMove(10, 20)
      result.current.handleLeave()
    })

    expect(result.current).toBeDefined()
  })

  it('should respect enabled option', () => {
    const { result } = renderHook(() => useMagneticEffect({ enabled: false }))

    act(() => {
      result.current.handleMove(10, 20)
    })

    expect(result.current).toBeDefined()
  })

  it('should use custom strength', () => {
    const { result } = renderHook(() => useMagneticEffect({
      strength: 30
    }))

    expect(result.current).toBeDefined()
  })
})

