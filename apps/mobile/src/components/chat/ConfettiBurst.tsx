/**
 * Confetti Burst — Mobile (Reanimated v3)
 * - Physics-like: upward impulse + gravity + lateral drift + spin
 * - Deterministic seeding, reduced motion fast fallback
 *
 * Location: apps/mobile/src/components/chat/ConfettiBurst.tsx
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing } from '@petspark/motion'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

export interface ConfettiBurstProps {
  enabled?: boolean
  particleCount?: number
  colors?: string[]
  duration?: number
  onComplete?: () => void
  seed?: number | string
}

// Create particles helper - returns particle data without SharedValues
// SharedValues will be created at component level
function createParticleData(
  particleCount: number,
  colors: string[],
  seed: number | string,
  reduced: boolean
): Array<{
  color: string
  w: number
  h: number
  delay: number
  vx: number
  initialScale: number
}> {
  const rng = createSeededRNG(seed)
  const particles: Array<{
    color: string
    w: number
    h: number
    delay: number
    vx: number
    initialScale: number
  }> = []
  const colorCount = Math.max(1, colors.length)

  for (let i = 0; i < particleCount; i++) {
    const color = colors[Math.floor(rng.range(0, colorCount))] ?? colors[0] ?? 'var(--color-bg-overlay)'
    const w = Math.max(6, Math.floor(rng.range(6, 12)))
    const h = Math.max(6, Math.floor(rng.range(6, 12)))
    const delay = Math.floor(rng.range(0, reduced ? 0 : 400))
    const vx = rng.range(-30, 30)
    const initialScale = rng.range(0.85, 1.25)

    particles.push({
      color,
      w,
      h,
      delay,
      vx,
      initialScale,
    })
  }

  return particles
}

// Maximum particles supported
const MAX_PARTICLES = 200

// Individual particle component - manages its own SharedValues (hooks called at component level)
interface ConfettiParticleViewProps {
  enabled: boolean
  color: string
  width: number
  height: number
  delay: number
  vx: number
  initialScale: number
  duration: number
  reduced: boolean
  onComplete: () => void
}

function ConfettiParticleView({
  enabled,
  color,
  width,
  height,
  delay,
  vx,
  initialScale,
  duration,
  reduced,
  onComplete,
}: ConfettiParticleViewProps): React.ReactElement {
  // Each particle has its own SharedValues - hooks called at component level
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const r = useSharedValue(0)
  const s = useSharedValue(initialScale)
  const o = useSharedValue(0)
  const finishedRef = useRef(false)

  // Extract completion callback to reduce nesting
  const handleComplete = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onComplete()
  }, [onComplete])

  // Extract reduced motion animation logic
  const animateReducedMotion = useCallback(() => {
    o.value = withTiming(1, { duration: 0 })
    y.value = withTiming(40, { duration: getReducedMotionDuration(120, true) }, () => {
      o.value = withTiming(0, { duration: 120 }, handleComplete)
    })
  }, [o, y, handleComplete])

  // Extract normal animation logic
  const animateNormal = useCallback(() => {
    o.value = withDelay(delay, withTiming(1, { duration: 100 }))
    x.value = withDelay(delay, withTiming(vx, { duration }))
    y.value = withDelay(
      delay,
      withTiming(160, { duration, easing: Easing.inOut(Easing.cubic) }, () => {
        o.value = withTiming(0, { duration: 180 }, handleComplete)
      })
    )
    r.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: Math.max(600, duration * 0.6), easing: Easing.linear }),
        -1,
        false
      )
    )
  }, [delay, vx, duration, x, y, r, o, handleComplete])

  useEffect(() => {
    if (!enabled || finishedRef.current) return
    finishedRef.current = false

    if (reduced) {
      animateReducedMotion()
      return
    }

    animateNormal()
  }, [enabled, reduced, animateReducedMotion, animateNormal])

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    opacity: o.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${r.value}deg` },
      { scale: s.value },
    ],
    width,
    height,
    backgroundColor: color,
    borderRadius: 2,
  }))

  return <Animated.View style={style} />
}

export function ConfettiBurst({
  enabled = true,
  particleCount = 100,
  colors = ['var(--color-success-9)', 'var(--color-accent-secondary-9)', 'var(--color-warning-9)', 'var(--color-error-9)', '#a855f7'],
  duration = 1400,
  onComplete,
  seed = 'confetti-burst',
}: ConfettiBurstProps): React.ReactElement {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(duration, reduced)
  const finishedCountRef = useRef(0)
  const expectedCountRef = useRef(0)

  // Create particle data (deterministic, no hooks)
  const particleData = useMemo(
    () => createParticleData(Math.min(particleCount, MAX_PARTICLES), colors, seed, reduced),
    [particleCount, colors, seed, reduced]
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
        <ConfettiParticleView
          key={i}
          enabled={enabled}
          color={data.color}
          width={data.w}
          height={data.h}
          delay={data.delay}
          vx={data.vx}
          initialScale={data.initialScale}
          duration={dur}
          reduced={reduced}
          onComplete={handleParticleComplete}
        />
      ))}
    </View>
  )
}
