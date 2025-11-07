'use client'

import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { useEffect } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseShimmerOptions {
  duration?: number
  delay?: number
  shimmerWidth?: number
  enabled?: boolean
}

export interface UseShimmerReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>
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
    enabled = true
  } = options

  const translateX = useSharedValue(-shimmerWidth)
  const opacity = useSharedValue(0.3)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value
    }
  })

  const start = () => {
    translateX.value = withRepeat(
      withTiming(shimmerWidth, {
        duration,
        easing: Easing.linear
      }),
      -1,
      false
    )
    opacity.value = withRepeat(
      withTiming(0.3, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )
  }

  const stop = () => {
    translateX.value = -shimmerWidth
    opacity.value = 0.3
  }

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
      return undefined
    }
  }, [enabled, delay])

  return {
    animatedStyle,
    start,
    stop
  }
}

