/**
 * Reaction Burst Particles — Mobile (Reanimated v3, UI-thread)
 * - Ring emission with subtle jitter
 * - Deterministic phases via seeded RNG
 * - Reduced motion → fast micro-pop (≤120ms)
 * 
 * Location: apps/mobile/src/components/chat/ReactionBurstParticles.native.tsx
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

export interface ReactionBurstParticlesProps {
  enabled?: boolean
  onComplete?: () => void
  count?: number
  radius?: number
  seed?: number | string
  color?: string
  size?: number
  staggerMs?: number
}

interface Particle {
  progress: SharedValue<number>
  scale: SharedValue<number>
  opacity: SharedValue<number>
  tx: number
  ty: number
  delay: number
}

function useParticles(
  count: number,
  radius: number,
  seed: number | string,
  staggerMs: number
): { particles: Particle[]; finished: SharedValue<number> } {
  const particlesRef = useRef<Particle[]>([])
  const finishedRef = useRef<SharedValue<number> | null>(null)

  if (finishedRef.current === null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    finishedRef.current = useSharedValue(0)
  }

  const finished = finishedRef.current

  if (particlesRef.current.length !== count) {
    const rng = createSeededRNG(seed)
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const base = (i / count) * Math.PI * 2 + rng.range(-0.08, 0.08)
      const tx = Math.cos(base) * radius * rng.range(0.9, 1.05)
      const ty = Math.sin(base) * radius * rng.range(0.9, 1.05)

      // Reanimated's useSharedValue is designed to be called in loops
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const progress = useSharedValue(0)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const scale = useSharedValue(0.7)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const opacity = useSharedValue(0)

      newParticles.push({
        progress,
        scale,
        opacity,
        tx,
        ty,
        delay: i * staggerMs,
      })
    }

    particlesRef.current = newParticles
  }

  return { particles: particlesRef.current, finished }
}

export function ReactionBurstParticles({
  enabled = true,
  onComplete,
  count = 18,
  radius = 48,
  seed = 'reaction-burst',
  color = '#3B82F6',
  size = 6,
  staggerMs = 8,
}: ReactionBurstParticlesProps): React.ReactElement {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(600, reduced)
  const { particles, finished } = useParticles(count, radius, seed, staggerMs)

  useEffect(() => {
    if (!enabled) return

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!
      if (reduced) {
        particle.opacity.value = withTiming(1, { duration: 0 })
        particle.scale.value = withTiming(1, { duration: 0 })
        particle.progress.value = withTiming(1, { duration: getReducedMotionDuration(120, true) }, () => {
          finished.value += 1
          if (finished.value === particles.length && onComplete) {
            runOnJS(onComplete)()
          }
        })
        continue
      }

      particle.opacity.value = withDelay(particle.delay, withTiming(1, { duration: Math.max(80, dur * 0.25) }))
      particle.scale.value = withDelay(particle.delay, withSpring(1, { stiffness: 220, damping: 22 }))
      particle.progress.value = withDelay(
        particle.delay,
        withTiming(1, { duration: dur, easing: Easing.out(Easing.cubic) }, () => {
          particle.opacity.value = withTiming(0, { duration: Math.max(100, dur * 0.35) }, () => {
            finished.value += 1
            if (finished.value === particles.length && onComplete) {
              runOnJS(onComplete)()
            }
          })
        })
      )
    }
  }, [enabled, particles, dur, reduced, finished, onComplete])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, i) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const style = useAnimatedStyle(() => ({
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: [
            { translateX: particle.progress.value * particle.tx },
            { translateY: particle.progress.value * particle.ty },
            { scale: particle.scale.value },
          ],
          opacity: particle.opacity.value,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }))

        return <Animated.View key={i} style={style} />
      })}
    </View>
  )
}

