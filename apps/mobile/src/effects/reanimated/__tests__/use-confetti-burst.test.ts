import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useConfettiBurst } from '../use-confetti-burst'

describe('useConfettiBurst', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConfettiBurst())

    expect(result.current.burst).toBeDefined()
    expect(result.current.particles).toEqual([])
    expect(result.current.createParticleStyle).toBeDefined()
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.progress).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useConfettiBurst({
        particleCount: 50,
        colors: ['#ff0000', '#00ff00'],
        duration: 3000,
        spread: 300,
      })
    )

    expect(result.current.burst).toBeDefined()
    expect(result.current.particles).toEqual([])
  })

  it('should create particles on burst', () => {
    const { result } = renderHook(() => useConfettiBurst({ particleCount: 10 }))

    act(() => {
      result.current.burst()
    })

    expect(result.current.particles.length).toBe(10)
    expect(result.current.isAnimating).toBe(true)
  })

  it('should create particles at custom position', () => {
    const { result } = renderHook(() => useConfettiBurst({ particleCount: 5 }))

    act(() => {
      result.current.burst(100, 200)
    })

    expect(result.current.particles.length).toBe(5)
    result.current.particles.forEach(particle => {
      expect(particle.x).toBe(100)
      expect(particle.y).toBe(200)
    })
  })

  it('should animate progress on burst', async () => {
    const { result } = renderHook(() => useConfettiBurst({ duration: 1000 }))

    act(() => {
      result.current.burst()
    })

    expect(result.current.progress.value).toBe(0)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current.progress.value).toBeGreaterThan(0)
    })
  })

  it('should clear particles after duration', () => {
    const { result } = renderHook(() => useConfettiBurst({ duration: 1000 }))

    act(() => {
      result.current.burst()
    })

    expect(result.current.particles.length).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(result.current.particles.length).toBe(0)
    expect(result.current.isAnimating).toBe(false)
  })

  it('should create particle style function', () => {
    const { result } = renderHook(() => useConfettiBurst())

    act(() => {
      result.current.burst()
    })

    const particle = result.current.particles[0]
    if (particle) {
      const styleFunction = result.current.createParticleStyle(particle)
      expect(styleFunction).toBeDefined()
      expect(typeof styleFunction).toBe('function')
    }
  })

  it('should use custom colors', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff']
    const { result } = renderHook(() => useConfettiBurst({ colors: customColors }))

    act(() => {
      result.current.burst()
    })

    result.current.particles.forEach(particle => {
      expect(customColors).toContain(particle.color)
    })
  })

  it('should use custom spread', () => {
    const { result } = renderHook(() => useConfettiBurst({ spread: 500 }))

    act(() => {
      result.current.burst()
    })

    result.current.particles.forEach(particle => {
      const velocityMagnitude = Math.sqrt(
        particle.velocity.x * particle.velocity.x + particle.velocity.y * particle.velocity.y
      )
      expect(velocityMagnitude).toBeGreaterThan(0)
    })
  })
})
