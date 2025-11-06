/**
 * Confetti Burst — Web (Reanimated v3)
 * - Physics-like: upward impulse + gravity + lateral drift + spin
 * - Deterministic seeding, reduced motion fast fallback
 * 
 * Location: apps/web/src/components/chat/ConfettiBurst.tsx
 */

import { useEffect, useMemo } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

export interface ConfettiParticle {
  x: Animated.SharedValue<number>
  y: Animated.SharedValue<number>
  r: Animated.SharedValue<number>
  s: Animated.SharedValue<number>
  o: Animated.SharedValue<number>
  color: string
  w: number
  h: number
  delay: number
  vx: number
  vy: number
}

export interface ConfettiBurstProps {
  enabled?: boolean
  particleCount?: number
  colors?: string[]
  duration?: number
  onComplete?: () => void
  className?: string
  seed?: number | string
}

export function ConfettiBurst({
  enabled = true,
  particleCount = 120,
  colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'],
  duration = 1400,
  onComplete,
  className,
  seed = 'confetti-burst',
}: ConfettiBurstProps) {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(duration, reduced)
  const finished = useSharedValue(0)

  const particles = useMemo<ConfettiParticle[]>(() => {
    const rng = createSeededRNG(seed)
    return Array.from({ length: particleCount }, (_, i) => {
      const x = useSharedValue(0)
      const y = useSharedValue(0)
      const r = useSharedValue(0)
      const s = useSharedValue(rng.range(0.85, 1.25))
      const o = useSharedValue(0)
      const color = colors[i % colors.length] ?? colors[0] ?? '#22c55e'
      const w = rng.rangeInt(6, 12)
      const h = rng.rangeInt(6, 12)
      const delay = i * (reduced ? 0 : 5)
      const vx = Math.cos(rng.range(0, Math.PI * 2)) * 40
      const vy = -120 - rng.range(0, 80)
      return { x, y, r, s, o, color, w, h, delay, vx, vy }
    })
  }, [particleCount, colors, seed, reduced])

  useEffect(() => {
    if (!enabled) return

    particles.forEach((p) => {
      if (reduced) {
        p.o.value = withTiming(1, { duration: 0 })
        p.s.value = withTiming(1, { duration: 0 })
        p.y.value = withTiming(40, { duration: getReducedMotionDuration(120, true) }, () => {
          p.o.value = withTiming(0, { duration: 120 }, () => {
            finished.value += 1
            if (finished.value === particles.length && onComplete) {
              runOnJS(onComplete)()
            }
          })
        })
        return
      }

      p.o.value = withDelay(p.delay, withTiming(1, { duration: 80 }))
      p.x.value = withDelay(
        p.delay,
        withTiming(p.vx, { duration: dur, easing: Easing.out(Easing.cubic) })
      )
      p.y.value = withDelay(
        p.delay,
        withTiming(p.vy, { duration: dur * 0.35, easing: Easing.out(Easing.quad) }, () => {
          p.y.value = withTiming(160, { duration: dur * 0.65, easing: Easing.in(Easing.cubic) }, () => {
            p.o.value = withTiming(0, { duration: Math.max(140, dur * 0.25) }, () => {
              finished.value += 1
              if (finished.value === particles.length && onComplete) {
                runOnJS(onComplete)()
              }
            })
          })
        })
      )
      p.r.value = withDelay(
        p.delay,
        withRepeat(withTiming(360, { duration: Math.max(600, dur * 0.6), easing: Easing.linear }), -1, false)
      )
    })
  }, [enabled, particles, dur, reduced, finished, onComplete])

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${className ?? ''}`}>
      {particles.map((p, i) => {
        const style = useAnimatedStyle(() => ({
          position: 'absolute',
          left: '50%',
          top: '50%',
          opacity: p.o.value,
          transform: [
            { translateX: p.x.value },
            { translateY: p.y.value },
            { rotate: `${p.r.value}deg` },
            { scale: p.s.value },
          ],
          width: p.w,
          height: p.h,
          backgroundColor: p.color,
          borderRadius: 2,
        }))

        return <Animated.View key={i} style={style} />
      })}
    </div>
  )
}

