'use client'

import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated'
import { useEffect } from 'react'

export interface UseGlowPulseOptions {
  duration?: number
  intensity?: number
  enabled?: boolean
  color?: string
}

export interface UseGlowPulseReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  start: () => void
  stop: () => void
}

const DEFAULT_DURATION = 2000
const DEFAULT_INTENSITY = 1
const DEFAULT_COLOR = 'rgba(var(--primary), 0.6)'

export function useGlowPulse(options: UseGlowPulseOptions = {}): UseGlowPulseReturn {
  const {
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
    enabled = true,
    color = DEFAULT_COLOR
  } = options

  const progress = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.3 * intensity, 0.6 * intensity, 0.3 * intensity]
    )

    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius: interpolate(
        progress.value,
        [0, 0.5, 1],
        [10, 20, 10]
      ),
      elevation: interpolate(
        progress.value,
        [0, 0.5, 1],
        [5, 10, 5]
      )
    }
  })

  const start = () => {
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )
  }

  const stop = () => {
    progress.value = 0
  }

  useEffect(() => {
    if (enabled) {
      start()
    } else {
      stop()
    }
  }, [enabled])

  return {
    animatedStyle,
    start,
    stop
  }
}

