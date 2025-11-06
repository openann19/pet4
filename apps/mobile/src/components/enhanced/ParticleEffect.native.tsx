import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

/**
 * Seeded Random Number Generator
 * Xorshift32 algorithm for deterministic random number generation.
 */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
}

export interface ParticleEffectProps {
  count?: number
  colors?: string[]
  triggerKey?: number
  testID?: string
}

export function ParticleEffect({
  count = 20,
  colors = ['#F97316', '#F59E0B', '#EF4444', '#EC4899', '#A855F7'],
  triggerKey = 0,
  testID = 'particle-effect',
}: ParticleEffectProps): React.JSX.Element {
  const [particles, setParticles] = useState<Particle[]>([])
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    if (triggerKey === 0 || reducedMotion.value) return

    const seed = triggerKey * 1000 + Date.now()
    const rng = makeRng(seed)

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const colorIndex = Math.floor(rng() * colors.length)
      const selectedColor = colors[colorIndex]
      return {
        id: i + triggerKey * 1000,
        x: rng() * 100 - 50,
        y: rng() * -100 - 50,
        size: rng() * 12 + 4,
        color: selectedColor ?? '#F97316',
        duration: rng() * 1.5 + 1,
        delay: rng() * 0.3,
      }
    })

    setParticles(newParticles)

    const timeout = setTimeout(() => {
      setParticles([])
    }, 2500)

    return () => clearTimeout(timeout)
  }, [triggerKey, count, colors, reducedMotion])

  if (reducedMotion.value || particles.length === 0) {
    return <View testID={testID} />
  }

  return (
    <View style={styles.container} testID={testID} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleAnimated key={particle.id} particle={particle} />
      ))}
    </View>
  )
}

function ParticleAnimated({ particle }: { particle: Particle }) {
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0)

  useEffect(() => {
    x.value = withDelay(
      particle.delay * 1000,
      withTiming(particle.x, { duration: particle.duration * 1000 })
    )
    y.value = withDelay(
      particle.delay * 1000,
      withTiming(particle.y, { duration: particle.duration * 1000 })
    )
    opacity.value = withDelay(
      particle.delay * 1000,
      withSequence(
        withTiming(1, { duration: particle.duration * 200 }),
        withTiming(1, { duration: particle.duration * 600 }),
        withTiming(0, { duration: particle.duration * 200 })
      )
    )
    scale.value = withDelay(
      particle.delay * 1000,
      withSequence(
        withTiming(1, { duration: particle.duration * 200 }),
        withTiming(1, { duration: particle.duration * 600 }),
        withTiming(0, { duration: particle.duration * 200 })
      )
    )
  }, [particle, x, y, opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
  },
})

