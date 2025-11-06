/**
 * Liquid Dots Typing Indicator — Mobile (RN)
 * - Reanimated sine chain + native shadow
 * - Reduced motion: instant pulse
 * - Haptics optional on first mount (subtle) — guarded and cooled down elsewhere
 */

import React, { useMemo } from 'react'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { View, Platform } from 'react-native'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

type DotCfg = { phase: number; y: Animated.SharedValue<number>; a: number; o: Animated.SharedValue<number> }

export interface LiquidDotsProps {
  enabled?: boolean
  dotSize?: number
  dotColor?: string
  dots?: number
  seed?: number | string
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = '#6b7280',
  dots = 3,
  seed = 'liquid-dots'
}: LiquidDotsProps) {
  const reduced = useReducedMotion()
  const t = useSharedValue(0)
  const dur = getReducedMotionDuration(1200, reduced)

  useMemo(() => {
    t.value = 0
    t.value = withRepeat(withTiming(1, { duration: dur }), -1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur, enabled])

  const config = useMemo(() => {
    const rng = createSeededRNG(seed)
    const arr: DotCfg[] = []
    for (let i = 0; i < dots; i++) {
      const phase = rng.range(0, Math.PI * 2)
      const a = rng.range(3, 7)
      arr.push({ phase, a, y: useSharedValue(0), o: useSharedValue(1) })
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dots, seed])

  config.forEach((d, i) => {
    const omega = 2 * Math.PI
    useDerivedValue(() => {
      if (!enabled || reduced) { 
        d.y.value = 0
        d.o.value = 1
        return 
      }
      const tt = t.value
      d.y.value = Math.sin(omega * tt + d.phase + i * 0.5) * d.a
      d.o.value = 0.6 + 0.4 * Math.sin(omega * tt + d.phase + i * 0.5 + Math.PI / 3)
    })
  })

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {config.map((d, i) => {
        const style = useAnimatedStyle(() => ({
          transform: [{ translateY: reduced ? 0 : d.y.value }],
          opacity: reduced ? 1 : d.o.value
        }))

        const shadow = Platform.select({
          ios: { 
            shadowColor: dotColor, 
            shadowOpacity: 0.25, 
            shadowRadius: dotSize * 0.6, 
            shadowOffset: { width: 0, height: 0 } 
          },
          android: { 
            elevation: 2 
          }
        })

        return (
          <Animated.View
            key={i}
            style={[{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }, shadow as any, style]}
          />
        )
      })}
    </View>
  )
}

