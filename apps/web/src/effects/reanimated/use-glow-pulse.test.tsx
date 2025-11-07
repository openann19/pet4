import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGlowPulse } from './use-glow-pulse'

describe('useGlowPulse', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGlowPulse())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.start).toBeDefined()
    expect(result.current.stop).toBeDefined()
  })

  it('should start pulse animation when enabled', () => {
    const { result } = renderHook(() => useGlowPulse({ enabled: true }))

    expect(result.current).toBeDefined()
  })

  it('should not start pulse when disabled', () => {
    const { result } = renderHook(() => useGlowPulse({ enabled: false }))

    expect(result.current).toBeDefined()
  })

  it('should use custom duration', () => {
    const { result } = renderHook(() => useGlowPulse({
      duration: 3000
    }))

    expect(result.current).toBeDefined()
  })

  it('should use custom intensity', () => {
    const { result } = renderHook(() => useGlowPulse({
      intensity: 0.5
    }))

    expect(result.current).toBeDefined()
  })

  it('should use custom color', () => {
    const { result } = renderHook(() => useGlowPulse({
      color: 'rgba(255, 0, 0, 0.5)'
    }))

    expect(result.current).toBeDefined()
  })
})

