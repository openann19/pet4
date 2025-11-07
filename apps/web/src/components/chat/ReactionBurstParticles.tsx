/**
 * Reaction Burst Particles — Web (Reanimated v3, UI-thread)
 * - Ring emission with subtle jitter
 * - Deterministic phases via seeded RNG
 * - Reduced motion → fast micro-pop (≤120ms)
 * 
 * Location: apps/web/src/components/chat/ReactionBurstParticles.tsx
 */

import { useEffect, useMemo } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'
import { isTruthy, isDefined } from '@/core/guards';

export interface ReactionBurstParticlesProps {
  enabled?: boolean
  onComplete?: () => void
  className?: string
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
  className,
  count = 18,
  radius = 48,
  seed = 'reaction-burst',
  color = '#3B82F6',
  size = 6,
  staggerMs = 8,
}: ReactionBurstParticlesProps) {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(600, reduced)

  const { particles, finishedCount } = useMemo(() => {
    const rng = createSeededRNG(seed)
    const arr = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const jitter = rng.range(-Math.PI / 24, Math.PI / 24)
      const theta = angle + jitter
      const sx = useSharedValue(0)
      const scale = useSharedValue(0.7)
      const opacity = useSharedValue(0)
      const tx = Math.cos(theta) * radius * rng.range(0.9, 1.05)
      const ty = Math.sin(theta) * radius * rng.range(0.9, 1.05)
      return { sx, scale, opacity, tx, ty, delay: i * staggerMs }
    })
    const finishedCount = useSharedValue(0)
    return { particles: arr, finishedCount }
  }, [count, radius, seed, staggerMs])

  useEffect(() => {
    if (!enabled) return

    particles.forEach((p) => {
      if (isTruthy(reduced)) {
        p.opacity.value = withTiming(0, { duration: 0 })
        p.scale.value = withTiming(1, { duration: 0 })
        p.sx.value = withTiming(1, { duration: getReducedMotionDuration(120, true) }, () => {
          finishedCount.value += 1
          if (finishedCount.value === particles.length && onComplete) {
            runOnJS(onComplete)()
          }
        })
        return
      }

      p.opacity.value = withDelay(
        p.delay,
        withTiming(1, { duration: Math.max(80, dur * 0.25), easing: Easing.out(Easing.cubic) })
      )
      p.scale.value = withDelay(p.delay, withSpring(1, { stiffness: 220, damping: 22 }))
      p.sx.value = withDelay(
        p.delay,
        withTiming(1, { duration: dur, easing: Easing.out(Easing.cubic) }, () => {
          p.opacity.value = withTiming(0, { duration: Math.max(100, dur * 0.35) }, () => {
            finishedCount.value += 1
            if (finishedCount.value === particles.length && onComplete) {
              runOnJS(onComplete)()
            }
          })
        })
      )
    })
  }, [enabled, dur, particles, onComplete, reduced, finishedCount])

  return (
    <div className={`absolute inset-0 pointer-events-none ${className ?? ''}`}>
      {particles.map((p, idx) => {
        const style = useAnimatedStyle(() => ({
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: [
            { translateX: p.sx.value * p.tx },
            { translateY: p.sx.value * p.ty },
            { scale: p.scale.value },
          ],
          opacity: p.opacity.value,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: `0 0 ${String(size * 0.7 ?? '')}px ${String(color ?? '')}55`,
        }))

        return <Animated.View key={idx} style={style} />
      })}
    </div>
  )
}

