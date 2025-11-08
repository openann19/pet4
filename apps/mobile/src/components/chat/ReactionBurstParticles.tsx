/**
 * Reaction Burst Particles — Mobile (Reanimated v3, UI-thread)
 * - Ring emission with subtle jitter
 * - Deterministic phases via seeded RNG
 * - Reduced motion → fast micro-pop (≤120ms)
 *
 * Location: apps/mobile/src/components/chat/ReactionBurstParticles.tsx
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
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

// Create particle data helper - returns data without SharedValues
function createParticleData(
  count: number,
  radius: number,
  seed: number | string,
  staggerMs: number
): Array<{
  tx: number
  ty: number
  delay: number
}> {
  const rng = createSeededRNG(seed)
  const particles: Array<{
    tx: number
    ty: number
    delay: number
  }> = []

  for (let i = 0; i < count; i++) {
    const base = (i / count) * Math.PI * 2 + rng.range(-0.08, 0.08)
    const tx = Math.cos(base) * radius * rng.range(0.9, 1.05)
    const ty = Math.sin(base) * radius * rng.range(0.9, 1.05)

    particles.push({
      tx,
      ty,
      delay: i * staggerMs,
    })
  }

  return particles
}

// Individual particle component - manages its own SharedValues (hooks called at component level)
interface ReactionParticleViewProps {
  enabled: boolean
  tx: number
  ty: number
  delay: number
  color: string
  size: number
  duration: number
  reduced: boolean
  onComplete: () => void
}

function ReactionParticleView({
  enabled,
  tx,
  ty,
  delay,
  color,
  size,
  duration,
  reduced,
  onComplete,
}: ReactionParticleViewProps): React.ReactElement {
  // Each particle has its own SharedValues - hooks called at component level
  const progress = useSharedValue(0)
  const scale = useSharedValue(0.7)
  const opacity = useSharedValue(0)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!enabled || finishedRef.current) return
    finishedRef.current = false

    if (reduced) {
      opacity.value = withTiming(1, { duration: 0 })
      scale.value = withTiming(1, { duration: 0 })
      progress.value = withTiming(1, { duration: getReducedMotionDuration(120, true) }, () => {
        finishedRef.current = true
        onComplete()
      })
      return
    }

    opacity.value = withDelay(delay, withTiming(1, { duration: Math.max(80, duration * 0.25) }))
    scale.value = withDelay(delay, withSpring(1, { stiffness: 220, damping: 22 }))
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }, () => {
        opacity.value = withTiming(0, { duration: Math.max(100, duration * 0.35) }, () => {
          finishedRef.current = true
          onComplete()
        })
      })
    )
  }, [enabled, delay, duration, reduced, progress, scale, opacity, onComplete])

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      { translateX: progress.value * tx },
      { translateY: progress.value * ty },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  }))

  return <Animated.View style={style} />
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
  const finishedCountRef = useRef(0)
  const expectedCountRef = useRef(0)

  // Create particle data (deterministic, no hooks)
  const particleData = useMemo(
    () => createParticleData(count, radius, seed, staggerMs),
    [count, radius, seed, staggerMs]
  )

  expectedCountRef.current = particleData.length

  const handleParticleComplete = useCallback(() => {
    finishedCountRef.current += 1
    if (finishedCountRef.current >= expectedCountRef.current && onComplete) {
      onComplete()
      finishedCountRef.current = 0
    }
  }, [onComplete])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particleData.map((data, i) => (
        <ReactionParticleView
          key={i}
          enabled={enabled}
          tx={data.tx}
          ty={data.ty}
          delay={data.delay}
          color={color}
          size={size}
          duration={dur}
          reduced={reduced}
          onComplete={handleParticleComplete}
        />
      ))}
    </View>
  )
}
