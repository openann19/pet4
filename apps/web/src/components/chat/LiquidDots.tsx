/**
 * Liquid Dots Typing Indicator — Web
 * - Reanimated-driven sine chain (UI thread)
 * - Deterministic phases via seeded RNG
 * - Reduced motion: instant subtle pulse (≤120ms)
 * - Premium glow + slight blur (web-only)
 */

import React, { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useAnimatedStyle, useSharedValue, withRepeat, withTiming, animate } from '@petspark/motion'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

interface DotConfig {
  readonly phase: number
  readonly amplitude: number
}

export interface LiquidDotsProps {
  readonly enabled?: boolean
  readonly dotSize?: number
  readonly dotColor?: string
  readonly className?: string
  readonly dots?: number
  readonly seed?: number | string
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = '#6b7280',
  className,
  dots = 3,
  seed = 'liquid-dots'
}: LiquidDotsProps) {
  const reduced = useReducedMotion()
  const sharedTime = useSharedValue(0)
  const duration = getReducedMotionDuration(1200, reduced)

  useEffect(() => {
    sharedTime.value = 0

    if (!enabled || reduced) {
      return () => {
        sharedTime.value = 0
      }
    }

    const timingTransition = withTiming(1, { duration });
    const repeatTransition = withRepeat(timingTransition, -1, false);
    animate(sharedTime, repeatTransition.target, repeatTransition.transition);

    return () => {
      sharedTime.value = 0
    }
  }, [duration, enabled, reduced, sharedTime])

  const dotConfigs = useMemo<DotConfig[]>(() => {
    const rng = createSeededRNG(seed)
    return Array.from({ length: dots }, () => ({
      phase: rng.range(0, Math.PI * 2),
      amplitude: rng.range(3, 7)
    }))
  }, [dots, seed])

  const omega = 2 * Math.PI

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1 ${className ?? ''}`}
      style={{ flexDirection: 'row' }}
    >
      {dotConfigs.map((dot, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const time = sharedTime.get()
          const translateY = reduced ? 0 : Math.sin(omega * time + dot.phase + index * 0.5) * dot.amplitude
          const opacity = reduced ? 1 : 0.6 + 0.4 * Math.sin(omega * time + dot.phase + index * 0.5 + Math.PI / 3)

          const style: CSSProperties = {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            filter: 'blur(0.4px)',
            boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`,
            transform: [{ translateY }],
            opacity
          }

          return style
        }, [dot.amplitude, dot.phase, dotColor, dotSize, index, omega, reduced, sharedTime])

        return (
          <AnimatedView
            key={`${dot.phase}-${index}`}
            style={animatedStyle}
          />
        )
      })}
    </div>
  )
}
