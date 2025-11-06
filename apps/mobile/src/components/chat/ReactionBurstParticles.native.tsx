/**
 * Reaction Burst Particles — Mobile (Reanimated v3, UI-thread)
 * - Ring emission with subtle jitter
 * - Deterministic phases via seeded RNG
 * - Reduced motion → fast micro-pop (≤120ms)
 * 
 * Location: apps/mobile/src/components/chat/ReactionBurstParticles.native.tsx
 */

import React, { useEffect, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
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

export function ReactionBurstParticles({
  enabled = true,
  onComplete,
  count = 18,
  radius = 48,
  seed = 'reaction-burst',
  color = '#3B82F6',
  size = 6,
  staggerMs = 8,
}: ReactionBurstParticlesProps) {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(600, reduced)

  const { particles, finished } = useMemo(() => {
    const rng = createSeededRNG(seed)
    const arr = Array.from({ length: count }, (_, i) => {
      const base = (i / count) * Math.PI * 2 + rng.range(-0.08, 0.08)
      const tx = Math.cos(base) * radius * rng.range(0.9, 1.05)
      const ty = Math.sin(base) * radius * rng.range(0.9, 1.05)
      return {
        progress: useSharedValue(0),
        scale: useSharedValue(0.7),
        opacity: useSharedValue(0),
        tx,
        ty,
        delay: i * staggerMs,
      }
    })
    return { particles: arr, finished: useSharedValue(0) }
  }, [count, radius, seed, staggerMs])

  useEffect(() => {
    if (!enabled) return

    particles.forEach((p) => {
      if (reduced) {
        p.opacity.value = withTiming(1, { duration: 0 })
        p.scale.value = withTiming(1, { duration: 0 })
        p.progress.value = withTiming(1, { duration: getReducedMotionDuration(120, true) }, () => {
          finished.value += 1
          if (finished.value === particles.length && onComplete) {
            runOnJS(onComplete)()
          }
        })
        return
      }

      p.opacity.value = withDelay(p.delay, withTiming(1, { duration: Math.max(80, dur * 0.25) }))
      p.scale.value = withDelay(p.delay, withSpring(1, { stiffness: 220, damping: 22 }))
      p.progress.value = withDelay(
        p.delay,
        withTiming(1, { duration: dur, easing: Easing.out(Easing.cubic) }, () => {
          p.opacity.value = withTiming(0, { duration: Math.max(100, dur * 0.35) }, () => {
            finished.value += 1
            if (finished.value === particles.length && onComplete) {
              runOnJS(onComplete)()
            }
          })
        })
      )
    })
  }, [enabled, particles, dur, reduced, finished, onComplete])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => {
        const style = useAnimatedStyle(() => ({
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: [
            { translateX: p.progress.value * p.tx },
            { translateY: p.progress.value * p.ty },
            { scale: p.scale.value },
          ],
          opacity: p.opacity.value,
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

