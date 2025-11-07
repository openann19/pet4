import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useParticleExplosionDelete } from './use-particle-explosion-delete'
import { isTruthy, isDefined } from '@/core/guards';

describe('useParticleExplosionDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with empty particles', () => {
    const { result } = renderHook(() => useParticleExplosionDelete())

    expect(result.current.particles).toEqual([])
  })

  it('should trigger explosion with particles', () => {
    const { result } = renderHook(() => useParticleExplosionDelete())

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
  })

  it('should use custom colors for explosion', () => {
    const customColors = ['#FF0000', '#00FF00', '#0000FF']
    const { result } = renderHook(() =>
      useParticleExplosionDelete({ colors: customColors })
    )

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
    result.current.particles.forEach((particle) => {
      expect(customColors).toContain(particle.color)
    })
  })

  it('should use explosion-specific colors when provided', () => {
    const defaultColors = ['#FF0000']
    const explosionColors = ['#00FF00', '#0000FF']
    const { result } = renderHook(() =>
      useParticleExplosionDelete({ colors: defaultColors })
    )

    act(() => {
      result.current.triggerExplosion(100, 100, explosionColors)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
    result.current.particles.forEach((particle) => {
      expect(explosionColors).toContain(particle.color)
    })
  })

  it('should respect custom particle count', () => {
    const { result } = renderHook(() =>
      useParticleExplosionDelete({ particleCount: 5 })
    )

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    expect(result.current.particles.length).toBe(5)
  })

  it('should clear particles', () => {
    const { result } = renderHook(() => useParticleExplosionDelete())

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)

    act(() => {
      result.current.clearParticles()
    })

    expect(result.current.particles).toEqual([])
  })

  it('should provide particle style function', () => {
    const { result } = renderHook(() => useParticleExplosionDelete())

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    if (result.current.particles.length > 0) {
      const particle = result.current.particles[0]
      if (isTruthy(particle)) {
        const style = result.current.getParticleStyle(particle)

        expect(style).toBeDefined()
      }
    }
  })

  it('should not trigger explosion when disabled', () => {
    const { result } = renderHook(() =>
      useParticleExplosionDelete({ enabled: false })
    )

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    expect(result.current.particles).toEqual([])
  })

  it('should auto-cleanup particles after lifetime', () => {
    const { result } = renderHook(() => useParticleExplosionDelete())

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    const initialCount = result.current.particles.length
    expect(initialCount).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.particles.length).toBe(0)
  })

  it('should handle multiple explosions', () => {
    const { result } = renderHook(() => useParticleExplosionDelete())

    act(() => {
      result.current.triggerExplosion(100, 100)
    })

    const firstCount = result.current.particles.length

    act(() => {
      result.current.triggerExplosion(200, 200)
    })

    expect(result.current.particles.length).toBeGreaterThan(firstCount)
  })
})

