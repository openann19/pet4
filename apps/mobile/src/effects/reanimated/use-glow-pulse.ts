import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { useCallback, useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseGlowPulseOptions {
  duration?: number
  intensity?: number
  enabled?: boolean
  color?: string
}

export interface UseGlowPulseReturn {
  animatedStyle: AnimatedStyle
  start: () => void
  stop: () => void
}

const DEFAULT_DURATION = 2000
const DEFAULT_INTENSITY = 1

export function useGlowPulse(options: UseGlowPulseOptions = {}): UseGlowPulseReturn {
  const {
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
    enabled = true,
    color = 'rgba(99, 102, 241, 0.6)',
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
      shadowOpacity: shadowOpacity,
      shadowRadius: interpolate(progress.value, [0, 0.5, 1], [10, 20, 10]),
      elevation: interpolate(progress.value, [0, 0.5, 1], [5, 10, 5]),
    }
  }) as AnimatedStyle

  const start = useCallback((): void => {
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
  }, [duration, progress])

  const stop = useCallback((): void => {
    progress.value = 0
  }, [progress])

  useEffect(() => {
    if (enabled) {
      start()
    } else {
      stop()
    }
  }, [enabled, start, stop])

  return {
    animatedStyle,
    start,
    stop,
  }
}
