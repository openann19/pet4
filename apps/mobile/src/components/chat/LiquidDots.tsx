/**
 * Liquid Dots Typing Indicator — Mobile (RN)
 * - Reanimated sine chain + native shadow
 * - Reduced motion: instant pulse
 * - Haptics optional on first mount (subtle) — guarded and cooled down elsewhere
 */

import React, { useMemo, useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { View, Platform } from 'react-native'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

interface DotProps {
  t: SharedValue<number>
  phase: number
  amplitude: number
  index: number
  enabled: boolean
  reduced: boolean
  dotSize: number
  dotColor: string
}

function Dot({
  t,
  phase,
  amplitude,
  index,
  enabled,
  reduced,
  dotSize,
  dotColor,
}: DotProps): React.ReactElement {
  const y = useDerivedValue(() => {
    if (!enabled || reduced) {
      return 0
    }
    const omega = 2 * Math.PI
    const tt = t.value
    return Math.sin(omega * tt + phase + index * 0.5) * amplitude
  })

  const opacity = useDerivedValue(() => {
    if (!enabled || reduced) {
      return 1
    }
    const omega = 2 * Math.PI
    const tt = t.value
    return 0.6 + 0.4 * Math.sin(omega * tt + phase + index * 0.5 + Math.PI / 3)
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reduced ? 0 : y.value }],
    opacity: reduced ? 1 : opacity.value,
  }))

  type ShadowStyle = {
    shadowColor?: string
    shadowOpacity?: number
    shadowRadius?: number
    shadowOffset?: { width: number; height: number }
    elevation?: number
  }

  const shadowStyle: ShadowStyle | undefined = Platform.select({
    ios: {
      shadowColor: dotColor,
      shadowOpacity: 0.25,
      shadowRadius: dotSize * 0.6,
      shadowOffset: { width: 0, height: 0 },
    },
    android: {
      elevation: 2,
    },
  })

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: dotColor,
        },
        shadowStyle,
        animatedStyle,
      ]}
    />
  )
}

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
  seed = 'liquid-dots',
}: LiquidDotsProps): React.ReactElement {
  const reduced = useReducedMotion()
  const t = useSharedValue(0)
  const dur = getReducedMotionDuration(1200, reduced)

  const dotConfigs = useMemo(() => {
    const rng = createSeededRNG(seed)
    const configs: Array<{ phase: number; amplitude: number }> = []
    for (let i = 0; i < dots; i++) {
      configs.push({
        phase: rng.range(0, Math.PI * 2),
        amplitude: rng.range(3, 7),
      })
    }
    return configs
  }, [dots, seed])

  useEffect(() => {
    if (enabled) {
      t.value = 0
      t.value = withRepeat(withTiming(1, { duration: dur }), -1, false)
    }
  }, [t, dur, enabled])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {dotConfigs.map((config, i) => (
        <Dot
          key={i}
          t={t}
          phase={config.phase}
          amplitude={config.amplitude}
          index={i}
          enabled={enabled}
          reduced={reduced}
          dotSize={dotSize}
          dotColor={dotColor}
        />
      ))}
    </View>
  )
}
