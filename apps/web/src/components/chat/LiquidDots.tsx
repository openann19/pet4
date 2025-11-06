/**
 * Liquid Dots Typing Indicator — Web
 * - Reanimated-driven sine chain (UI thread)
 * - Deterministic phases via seeded RNG
 * - Reduced motion: instant subtle pulse (≤120ms)
 * - Premium glow + slight blur (web-only)
 */

import React, { useMemo } from 'react'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'
import { View } from 'react-native'

type DotCfg = { phase: number; y: Animated.SharedValue<number>; a: number; o: Animated.SharedValue<number> }

export interface LiquidDotsProps {
  enabled?: boolean
  dotSize?: number
  dotColor?: string
  className?: string
  dots?: number
  seed?: number | string
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = '#6b7280', // slate-500
  className,
  dots = 3,
  seed = 'liquid-dots'
}: LiquidDotsProps) {
  const reduced = useReducedMotion()

  // shared clock loops 0..1
  const t = useSharedValue(0)
  const dur = getReducedMotionDuration(1200, reduced)
  // Looping timing; reduced motion short-circuits in styles below
  useMemo(() => {
    t.value = 0
    t.value = withRepeat(withTiming(1, { duration: dur }), -1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur, enabled])

  // Build deterministic phases/amps
  const config = useMemo(() => {
    const rng = createSeededRNG(seed)
    const arr: DotCfg[] = []
    for (let i = 0; i < dots; i++) {
      const phase = rng.range(0, Math.PI * 2)
      const a = rng.range(3, 7) // amplitude px
      arr.push({ phase, a, y: useSharedValue(0), o: useSharedValue(1) })
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dots, seed])

  // Derived motion per dot
  config.forEach((d, i) => {
    const omega = 2 * Math.PI // per cycle
    useDerivedValue(() => {
      if (!enabled) { 
        d.y.value = 0
        d.o.value = 1
        return 
      }
      if (reduced) { 
        d.y.value = 0
        d.o.value = 1
        return 
      }
      const tt = t.value
      // phase shift across dots (chain/"liquid" look)
      const y = Math.sin(omega * tt + d.phase + i * 0.5) * d.a
      d.y.value = y
      // opacity breath
      d.o.value = 0.6 + 0.4 * Math.sin(omega * tt + d.phase + i * 0.5 + Math.PI / 3)
    })
  })

  return (
    <View
      accessibilityRole="status"
      aria-live="polite"
      className={`flex items-center gap-1 ${className ?? ''}`}
      style={{ flexDirection: 'row' }}
    >
      {config.map((d, i) => {
        const style = useAnimatedStyle(() => ({
          transform: [{ translateY: reduced ? 0 : d.y.value }],
          opacity: reduced ? 1 : d.o.value
        }))

        // web-only glow/blur via style prop merging
        const glow: React.CSSProperties = {
          filter: 'blur(0.4px)',
          boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`
        }

        return (
          <Animated.View
            key={i}
            style={[{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor } as any, style, glow as any]}
          />
        )
      })}
    </View>
  )
}
