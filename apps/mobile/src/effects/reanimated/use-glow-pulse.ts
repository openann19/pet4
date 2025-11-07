import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, Easing, type SharedValue } from 'react-native-reanimated'
import { useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseGlowPulseOptions {
  duration?: number
  intensity?: number
  enabled?: boolean
  color?: string
}

export interface UseGlowPulseReturn {
  progress: SharedValue<number>
  animatedStyle: AnimatedStyle
  start: () => void
  stop: () => void
}

const DEFAULT_DURATION = 2000
const DEFAULT_INTENSITY = 1
const DEFAULT_COLOR = 'rgba(99, 102, 241, 0.6)'

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

    const shadowRadius = interpolate(
      progress.value,
      [0, 0.5, 1],
      [10, 20, 10]
    )

    const elevation = interpolate(
      progress.value,
      [0, 0.5, 1],
      [5, 10, 5]
    )

    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation
    }
  }) as AnimatedStyle

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
  }, [enabled, duration])

  return {
    progress,
    animatedStyle,
    start,
    stop
  }
}
