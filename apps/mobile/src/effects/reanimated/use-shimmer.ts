import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, type SharedValue } from '@petspark/motion'
import { useCallback, useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'
import { isTruthy } from '@petspark/shared';

export interface UseShimmerOptions {
  duration?: number
  delay?: number
  shimmerWidth?: number
  enabled?: boolean
}

export interface UseShimmerReturn {
  translateX: SharedValue<number>
  opacity: SharedValue<number>
  animatedStyle: AnimatedStyle
  start: () => void
  stop: () => void
}

const DEFAULT_DURATION = 2000
const DEFAULT_DELAY = 0
const DEFAULT_SHIMMER_WIDTH = 200

export function useShimmer(options: UseShimmerOptions = {}): UseShimmerReturn {
  const {
    duration = DEFAULT_DURATION,
    delay = DEFAULT_DELAY,
    shimmerWidth = DEFAULT_SHIMMER_WIDTH,
    enabled = true,
  } = options

  const translateX = useSharedValue(-shimmerWidth)
  const opacity = useSharedValue(0.3)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }
  }) as AnimatedStyle

  const start = useCallback(() => {
    translateX.value = withRepeat(
      withTiming(shimmerWidth, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    )
    opacity.value = withRepeat(
      withTiming(0.3, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
  }, [duration, shimmerWidth, translateX, opacity])

  const stop = useCallback(() => {
    translateX.value = -shimmerWidth
    opacity.value = 0.3
  }, [shimmerWidth, translateX, opacity])

  useEffect(() => {
    if (isTruthy(enabled)) {
      const timer = setTimeout(() => {
        start()
      }, delay)
      return () => {
        clearTimeout(timer)
        stop()
      }
    } else {
      stop()
      return
    }
  }, [enabled, delay, start, stop])

  return {
    translateX,
    opacity,
    animatedStyle,
    start,
    stop,
  }
}
