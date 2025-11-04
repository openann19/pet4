import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBubbleHoverTilt } from './use-bubble-hover-tilt'

describe('useBubbleHoverTilt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBubbleHoverTilt())

    expect(result.current.tiltX.value).toBe(0)
    expect(result.current.tiltY.value).toBe(0)
    expect(result.current.lift.value).toBe(0)
    expect(result.current.glowOpacity.value).toBe(0)
  })

  it('should initialize with disabled state when enabled is false', () => {
    const { result } = renderHook(() => useBubbleHoverTilt({ enabled: false }))

    expect(result.current.tiltX.value).toBe(0)
    expect(result.current.tiltY.value).toBe(0)
  })

  it('should handle mouse move events', () => {
    const { result } = renderHook(() => useBubbleHoverTilt())

    const mockEvent = {
      clientX: 100,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 100
        })
      }
    } as unknown as React.MouseEvent<HTMLElement>

    act(() => {
      result.current.handleMouseMove(mockEvent)
    })

    expect(result.current.lift.value).toBeLessThan(0)
    expect(result.current.glowOpacity.value).toBeGreaterThan(0)
  })

  it('should handle mouse leave events', () => {
    const { result } = renderHook(() => useBubbleHoverTilt())

    const mockEvent = {
      clientX: 100,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 100
        })
      }
    } as unknown as React.MouseEvent<HTMLElement>

    act(() => {
      result.current.handleMouseMove(mockEvent)
    })

    act(() => {
      result.current.handleMouseLeave()
    })

    expect(result.current.tiltX.value).toBe(0)
    expect(result.current.tiltY.value).toBe(0)
    expect(result.current.lift.value).toBe(0)
    expect(result.current.glowOpacity.value).toBe(0)
  })

  it('should not handle mouse move when disabled', () => {
    const { result } = renderHook(() => useBubbleHoverTilt({ enabled: false }))

    const mockEvent = {
      clientX: 100,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 100
        })
      }
    } as unknown as React.MouseEvent<HTMLElement>

    act(() => {
      result.current.handleMouseMove(mockEvent)
    })

    expect(result.current.tiltX.value).toBe(0)
    expect(result.current.tiltY.value).toBe(0)
  })

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useBubbleHoverTilt())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.glowStyle).toBeDefined()
  })

  it('should respect custom maxTilt', () => {
    const { result } = renderHook(() => useBubbleHoverTilt({ maxTilt: 15 }))

    const mockEvent = {
      clientX: 100,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 100
        })
      }
    } as unknown as React.MouseEvent<HTMLElement>

    act(() => {
      result.current.handleMouseMove(mockEvent)
    })

    expect(Math.abs(result.current.tiltX.value)).toBeLessThanOrEqual(15)
    expect(Math.abs(result.current.tiltY.value)).toBeLessThanOrEqual(15)
  })
})

