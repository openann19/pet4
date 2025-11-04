'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  type SharedValue
} from 'react-native-reanimated'

export interface Particle {
  id: string
  x: SharedValue<number>
  y: SharedValue<number>
  scale: SharedValue<number>
  opacity: SharedValue<number>
  rotation: SharedValue<number>
  vx: number
  vy: number
  color: string
  size: number
  lifetime: number
  createdAt: number
}

export interface ParticleConfig {
  count?: number
  colors?: string[]
  size?: number
  minSize?: number
  maxSize?: number
  lifetime?: number
  minLifetime?: number
  maxLifetime?: number
  velocity?: number
  minVelocity?: number
  maxVelocity?: number
  gravity?: number
  friction?: number
  spread?: number
}



export const DEFAULT_CONFIG: Required<ParticleConfig> = {
  count: 10,
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
  size: 8,
  minSize: 4,
  maxSize: 12,
  lifetime: 800,
  minLifetime: 600,
  maxLifetime: 1000,
  velocity: 200,
  minVelocity: 150,
  maxVelocity: 300,
  gravity: 0.3,
  friction: 0.98,
  spread: 360
}

export function createParticle(
  startX: number,
  startY: number,
  angle: number,
  config: Required<ParticleConfig>
): Particle {
  const id = `${Date.now()}-${Math.random()}`
  const velocity = config.minVelocity + Math.random() * (config.maxVelocity - config.minVelocity)
  const lifetime = config.minLifetime + Math.random() * (config.maxLifetime - config.minLifetime)
  const size = config.minSize + Math.random() * (config.maxSize - config.minSize)
  const colorIndex = Math.floor(Math.random() * config.colors.length)
  const color = config.colors[colorIndex] ?? config.colors[0] ?? '#FF6B6B'
  const radians = (angle * Math.PI) / 180

  const vx = Math.cos(radians) * velocity
  const vy = Math.sin(radians) * velocity

  return {
    id,
    x: useSharedValue(startX),
    y: useSharedValue(startY),
    scale: useSharedValue(0),
    opacity: useSharedValue(1),
    rotation: useSharedValue(0),
    vx,
    vy,
    color,
    size,
    lifetime,
    createdAt: Date.now()
  }
}

export function spawnParticles(
  originX: number,
  originY: number,
  config: ParticleConfig = {}
): Particle[] {
  const fullConfig: Required<ParticleConfig> = {
    ...DEFAULT_CONFIG,
    ...config
  }

  const particles: Particle[] = []
  const angleStep = fullConfig.spread / fullConfig.count

  for (let i = 0; i < fullConfig.count; i++) {
    const angle = -fullConfig.spread / 2 + i * angleStep + (Math.random() - 0.5) * 20
    const particle = createParticle(originX, originY, angle, fullConfig)
    particles.push(particle)
  }

  return particles
}

export function animateParticle(particle: Particle, config: Required<ParticleConfig>): void {
  const endX = particle.x.value + particle.vx * (particle.lifetime / 1000)
  const endY = particle.y.value + particle.vy * (particle.lifetime / 1000) + 
    (config.gravity * particle.lifetime * particle.lifetime) / 2000

  particle.x.value = withTiming(endX, {
    duration: particle.lifetime,
    easing: Easing.out(Easing.quad)
  })

  particle.y.value = withTiming(endY, {
    duration: particle.lifetime,
    easing: Easing.out(Easing.quad)
  })

  particle.scale.value = withSequence(
    withTiming(1, {
      duration: particle.lifetime * 0.2,
      easing: Easing.out(Easing.back(1.5))
    }),
    withTiming(0.8, {
      duration: particle.lifetime * 0.6,
      easing: Easing.inOut(Easing.ease)
    }),
    withTiming(0, {
      duration: particle.lifetime * 0.2,
      easing: Easing.in(Easing.ease)
    })
  )

  particle.opacity.value = withSequence(
    withTiming(1, {
      duration: particle.lifetime * 0.1,
      easing: Easing.out(Easing.ease)
    }),
    withTiming(0.9, {
      duration: particle.lifetime * 0.7,
      easing: Easing.inOut(Easing.ease)
    }),
    withTiming(0, {
      duration: particle.lifetime * 0.2,
      easing: Easing.in(Easing.ease)
    })
  )

  particle.rotation.value = withTiming(
    Math.random() * 360,
    {
      duration: particle.lifetime,
      easing: Easing.linear
    }
  )
}

export function createParticleAnimatedStyle(particle: Particle): ReturnType<typeof useAnimatedStyle> {
  return useAnimatedStyle(() => {
    return {
      position: 'absolute',
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
      ]
    }
  })
}
