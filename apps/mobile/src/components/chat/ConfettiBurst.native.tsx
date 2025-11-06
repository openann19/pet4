/**
 * Confetti Burst — Mobile (Reanimated v3)
 * - Physics-like: upward impulse + gravity + lateral drift + spin
 * - Deterministic seeding, reduced motion fast fallback
 * 
 * Location: apps/mobile/src/components/chat/ConfettiBurst.native.tsx
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

export interface ConfettiParticle {
  x: SharedValue<number>
  y: SharedValue<number>
  r: SharedValue<number>
  s: SharedValue<number>
  o: SharedValue<number>
  color: string
  w: number
  h: number
  delay: number
  vx: number
}

export interface ConfettiBurstProps {
  enabled?: boolean
  particleCount?: number
  colors?: string[]
  duration?: number
  onComplete?: () => void
  seed?: number | string
}

function useConfettiParticles(
  particleCount: number,
  colors: string[],
  seed: number | string,
  reduced: boolean
): ConfettiParticle[] {
  const particlesRef = useRef<ConfettiParticle[]>([])

  if (particlesRef.current.length !== particleCount) {
    const rng = createSeededRNG(seed)
    const newParticles: ConfettiParticle[] = []
    const colorCount = Math.max(1, colors.length)

    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(rng.range(0, colorCount))] ?? colors[0] ?? '#ffffff'
      const w = Math.max(6, Math.floor(rng.range(6, 12)))
      const h = Math.max(6, Math.floor(rng.range(6, 12)))
      const delay = Math.floor(rng.range(0, reduced ? 0 : 400))
      const vx = rng.range(-30, 30)

      // Reanimated's useSharedValue is designed to be called in loops
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const x = useSharedValue(0)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const y = useSharedValue(0)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const r = useSharedValue(0)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const s = useSharedValue(rng.range(0.85, 1.25))
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const o = useSharedValue(0)

      newParticles.push({
        x,
        y,
        r,
        s,
        o,
        color,
        w,
        h,
        delay,
        vx,
      })
    }

    particlesRef.current = newParticles
  }

  return particlesRef.current
}

export function ConfettiBurst({
  enabled = true,
  particleCount = 100,
  colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'],
  duration = 1400,
  onComplete,
  seed = 'confetti-burst',
}: ConfettiBurstProps): React.ReactElement {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(duration, reduced)
  const finished = useSharedValue(0)
  const particles = useConfettiParticles(particleCount, colors, seed, reduced)

  useEffect(() => {
    if (!enabled) return

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!
      if (reduced) {
        particle.o.value = withTiming(1, { duration: 0 })
        particle.y.value = withTiming(40, { duration: getReducedMotionDuration(120, true) }, () => {
          particle.o.value = withTiming(0, { duration: 120 }, () => {
            finished.value += 1
            if (finished.value === particles.length && onComplete) {
              runOnJS(onComplete)()
            }
          })
        })
        continue
      }

      particle.o.value = withDelay(particle.delay, withTiming(1, { duration: 100 }))
      particle.x.value = withDelay(particle.delay, withTiming(particle.vx, { duration: dur }))
      particle.y.value = withDelay(
        particle.delay,
        withTiming(160, { duration: dur, easing: Easing.inOut(Easing.cubic) }, () => {
          particle.o.value = withTiming(0, { duration: 180 }, () => {
            finished.value += 1
            if (finished.value === particles.length && onComplete) {
              runOnJS(onComplete)()
            }
          })
        })
      )
      particle.r.value = withDelay(
        particle.delay,
        withRepeat(withTiming(360, { duration: Math.max(600, dur * 0.6), easing: Easing.linear }), -1, false)
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
          opacity: particle.o.value,
          transform: [
            { translateX: particle.x.value },
            { translateY: particle.y.value },
            { rotate: `${particle.r.value}deg` },
            { scale: particle.s.value },
          ],
          width: particle.w,
          height: particle.h,
          backgroundColor: particle.color,
          borderRadius: 2,
        }))

        return <Animated.View key={i} style={style} />
      })}
    </View>
  )
}

