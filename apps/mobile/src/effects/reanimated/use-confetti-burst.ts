import { useSharedValue, useAnimatedStyle, withTiming, withSequence, interpolate, Easing, type SharedValue } from 'react-native-reanimated'
import { useCallback, useState } from 'react'
import { Dimensions } from 'react-native'
import type { AnimatedStyle } from './animated-view'

export interface ConfettiParticle {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  velocity: { x: number; y: number }
}

export interface UseConfettiBurstOptions {
  particleCount?: number
  colors?: string[]
  duration?: number
  spread?: number
}

export interface UseConfettiBurstReturn {
  burst: (centerX?: number, centerY?: number) => void
  particles: ConfettiParticle[]
  createParticleStyle: (particle: ConfettiParticle) => AnimatedStyle
  isAnimating: boolean
  progress: SharedValue<number>
}

function makeRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

export function useConfettiBurst(options: UseConfettiBurstOptions = {}): UseConfettiBurstReturn {
  const {
    particleCount = 30,
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'],
    duration = 2000,
    spread = 200,
  } = options

  const [particles, setParticles] = useState<ConfettiParticle[]>([])
  const progress = useSharedValue(0)

  const burst = useCallback(
    (centerX?: number, centerY?: number) => {
      const screen = Dimensions.get('window')
      const x = centerX ?? screen.width / 2
      const y = centerY ?? screen.height / 2

      const newParticles: ConfettiParticle[] = []
      
      const seed = Date.now() + x + y
      const rng = makeRng(seed)

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount
        const velocity = rng() * spread + spread * 0.5
        const color = colors[Math.floor(rng() * colors.length)] ?? colors[0] ?? '#ff6b6b'

        newParticles.push({
          id: Date.now() + i,
          x,
          y,
          color,
          size: rng() * 8 + 4,
          rotation: rng() * 360,
          velocity: {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity - 100,
          },
        })
      }

      setParticles(newParticles)

      progress.value = 0
      progress.value = withSequence(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) })
      )

      setTimeout(() => {
        setParticles([])
      }, duration)
    },
    [particleCount, colors, duration, spread, progress]
  )

  const createParticleStyle = useCallback(
    (particle: ConfettiParticle) => {
      return useAnimatedStyle(() => {
        const x = particle.x + particle.velocity.x * progress.value
        const y = particle.y + particle.velocity.y * progress.value + 300 * progress.value * progress.value
        
        const rotation = particle.rotation + progress.value * 720
        const opacity = interpolate(progress.value, [0, 0.7, 1], [1, 1, 0])
        const scale = interpolate(progress.value, [0, 0.2, 1], [0, 1, 0.8])

        return {
          transform: [
            { translateX: x },
            { translateY: y },
            { rotate: `${String(rotation ?? '')}deg` },
            { scale },
          ],
          opacity,
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size,
        }
      }) as AnimatedStyle
    },
    [progress]
  )

  return {
    burst,
    particles,
    createParticleStyle,
    isAnimating: particles.length > 0,
    progress
  }
}
