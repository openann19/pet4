'use client'

import {
  useAnimatedStyle
} from 'react-native-reanimated'
import { useState, useCallback, useEffect } from 'react'
import {
  spawnParticles,
  animateParticle,
  type Particle,
  type ParticleConfig
} from '@/effects/reanimated/particle-engine'

export interface UseParticleExplosionDeleteOptions {
  originX?: number
  originY?: number
  colors?: string[]
  particleCount?: number
  enabled?: boolean
}

export interface UseParticleExplosionDeleteReturn {
  particles: Particle[]
  triggerExplosion: (x: number, y: number, colors?: string[]) => void
  clearParticles: () => void
  getParticleStyle: (particle: Particle) => ReturnType<typeof useAnimatedStyle>
}

const DEFAULT_PARTICLE_COUNT = 15
const DEFAULT_ENABLED = true
const DEFAULT_EXPLOSION_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#FFD93D',
  '#FF6B35'
]

export function useParticleExplosionDelete(
  options: UseParticleExplosionDeleteOptions = {}
): UseParticleExplosionDeleteReturn {
  const {
    colors = DEFAULT_EXPLOSION_COLORS,
    particleCount = DEFAULT_PARTICLE_COUNT,
    enabled = DEFAULT_ENABLED
  } = options

  const [particles, setParticles] = useState<Particle[]>([])

  const triggerExplosion = useCallback(
    (x: number, y: number, explosionColors?: string[]) => {
      if (!enabled) return

      const particleConfig: ParticleConfig = {
        count: particleCount,
        colors: explosionColors ?? colors,
        minSize: 6,
        maxSize: 14,
        minLifetime: 600,
        maxLifetime: 1000,
        minVelocity: 200,
        maxVelocity: 400,
        gravity: 0.5,
        friction: 0.97,
        spread: 360
      }

      const newParticles = spawnParticles(x, y, particleConfig)

      newParticles.forEach((particle) => {
        animateParticle(particle, {
          ...particleConfig,
          count: particleConfig.count ?? DEFAULT_PARTICLE_COUNT,
          colors: particleConfig.colors ?? colors,
          size: particleConfig.size ?? 8,
          minSize: particleConfig.minSize ?? 6,
          maxSize: particleConfig.maxSize ?? 14,
          lifetime: particleConfig.lifetime ?? 800,
          minLifetime: particleConfig.minLifetime ?? 600,
          maxLifetime: particleConfig.maxLifetime ?? 1000,
          velocity: particleConfig.velocity ?? 250,
          minVelocity: particleConfig.minVelocity ?? 200,
          maxVelocity: particleConfig.maxVelocity ?? 400,
          gravity: particleConfig.gravity ?? 0.5,
          friction: particleConfig.friction ?? 0.97,
          spread: particleConfig.spread ?? 360
        })
      })

      setParticles(newParticles)

      setTimeout(() => {
        setParticles((prev) =>
          prev.filter(
            (p) => Date.now() - p.createdAt < (p.lifetime + 200)
          )
        )
      }, 1200)
    },
    [enabled, particleCount, colors]
  )

  const clearParticles = useCallback(() => {
    setParticles([])
  }, [])

  const getParticleStyle = useCallback(
    (particle: Particle): ReturnType<typeof useAnimatedStyle> => {
      return useAnimatedStyle(() => {
        return {
          position: 'absolute' as const,
          left: particle.x.value,
          top: particle.y.value,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 2,
          opacity: particle.opacity.value,
          transform: [
            { scale: particle.scale.value },
            { rotate: `${particle.rotation.value}deg` }
          ],
          pointerEvents: 'none' as const,
          zIndex: 9999
        }
      })
    },
    []
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.filter((p) => Date.now() - p.createdAt < (p.lifetime + 200))
      )
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return {
    particles,
    triggerExplosion,
    clearParticles,
    getParticleStyle
  }
}
