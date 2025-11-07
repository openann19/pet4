'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  type SharedValue
} from 'react-native-reanimated'
import { useEffect, useCallback } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseTypingShimmerOptions {
  duration?: number
  shimmerWidth?: number
  enabled?: boolean
  isComplete?: boolean
}

export interface UseTypingShimmerReturn {
  shimmerTranslateX: SharedValue<number>
  shimmerOpacity: SharedValue<number>
  placeholderOpacity: SharedValue<number>
  placeholderScale: SharedValue<number>
  contentOpacity: SharedValue<number>
  contentScale: SharedValue<number>
  shimmerStyle: ReturnType<typeof useAnimatedStyle>
  placeholderStyle: ReturnType<typeof useAnimatedStyle>
  contentStyle: ReturnType<typeof useAnimatedStyle>
  start: () => void
  stop: () => void
  reveal: () => void
}

const DEFAULT_DURATION = 2000
const DEFAULT_SHIMMER_WIDTH = 200

export function useTypingShimmer(
  options: UseTypingShimmerOptions = {}
): UseTypingShimmerReturn {
  const {
    duration = DEFAULT_DURATION,
    shimmerWidth = DEFAULT_SHIMMER_WIDTH,
    enabled = true,
    isComplete = false
  } = options

  const shimmerTranslateX = useSharedValue(-shimmerWidth)
  const shimmerOpacity = useSharedValue(0.4)
  const placeholderOpacity = useSharedValue(1)
  const placeholderScale = useSharedValue(1)
  const contentOpacity = useSharedValue(0)
  const contentScale = useSharedValue(0.95)

  const start = useCallback(() => {
    if (!enabled) {
      return
    }

    shimmerTranslateX.value = withRepeat(
      withTiming(shimmerWidth * 2, {
        duration,
        easing: Easing.linear
      }),
      -1,
      false
    )

    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, {
          duration: duration / 3,
          easing: Easing.inOut(Easing.ease)
        }),
        withTiming(0.3, {
          duration: duration / 3,
          easing: Easing.inOut(Easing.ease)
        }),
        withTiming(0.6, {
          duration: duration / 3,
          easing: Easing.inOut(Easing.ease)
        })
      ),
      -1,
      false
    )
  }, [enabled, duration, shimmerWidth, shimmerTranslateX, shimmerOpacity])

  const stop = useCallback(() => {
    shimmerTranslateX.value = -shimmerWidth
    shimmerOpacity.value = 0.4
  }, [shimmerWidth, shimmerTranslateX, shimmerOpacity])

  const reveal = useCallback(() => {
    placeholderOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease)
    })
    placeholderScale.value = withTiming(0.9, {
      duration: 300,
      easing: Easing.out(Easing.ease)
    })

    contentOpacity.value = withDelay(
      150,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease)
      })
    )
    contentScale.value = withDelay(
      150,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic)
      })
    )

    stop()
  }, [placeholderOpacity, placeholderScale, contentOpacity, contentScale, stop])

  useEffect(() => {
    if (enabled && !isComplete) {
      start()
    } else {
      stop()
    }

    if (isTruthy(isComplete)) {
      reveal()
    }
  }, [enabled, isComplete, start, stop, reveal])

  const shimmerStyle = useAnimatedStyle(() => {
    const gradientStart = shimmerTranslateX.value
    const gradientEnd = shimmerTranslateX.value + shimmerWidth

    return {
      transform: [{ translateX: shimmerTranslateX.value }],
      opacity: shimmerOpacity.value,
      background: `linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, ${String(shimmerOpacity.value * 0.5 ?? '')}) ${String(gradientStart ?? '')}px, 
        rgba(255, 255, 255, ${String(shimmerOpacity.value ?? '')}) ${String((gradientStart + gradientEnd) / 2 ?? '')}px, 
        rgba(255, 255, 255, ${String(shimmerOpacity.value * 0.5 ?? '')}) ${String(gradientEnd ?? '')}px, 
        transparent 100%
      )`
    }
  })

  const placeholderStyle = useAnimatedStyle(() => {
    return {
      opacity: placeholderOpacity.value,
      transform: [{ scale: placeholderScale.value }]
    }
  })

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ scale: contentScale.value }]
    }
  })

  return {
    shimmerTranslateX,
    shimmerOpacity,
    placeholderOpacity,
    placeholderScale,
    contentOpacity,
    contentScale,
    shimmerStyle,
    placeholderStyle,
    contentStyle,
    start,
    stop,
    reveal
  }
}
