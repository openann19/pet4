'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseAiReplyAnimationOptions {
  enabled?: boolean
  showShimmer?: boolean
  showSparkles?: boolean
  showGlow?: boolean
  shimmerSpeed?: number
  glowIntensity?: number
}

export interface UseAiReplyAnimationReturn {
  shimmerStyle: ReturnType<typeof useAnimatedStyle>
  sparkleStyle: ReturnType<typeof useAnimatedStyle>
  glowStyle: ReturnType<typeof useAnimatedStyle>
  containerStyle: ReturnType<typeof useAnimatedStyle>
  shimmerProgress: SharedValue<number>
  glowOpacity: SharedValue<number>
}

const DEFAULT_ENABLED = true
const DEFAULT_SHOW_SHIMMER = true
const DEFAULT_SHOW_SPARKLES = true
const DEFAULT_SHOW_GLOW = true
const DEFAULT_SHIMMER_SPEED = 2000
const DEFAULT_GLOW_INTENSITY = 0.6

export function useAiReplyAnimation(
  options: UseAiReplyAnimationOptions = {}
): UseAiReplyAnimationReturn {
  const {
    enabled = DEFAULT_ENABLED,
    showShimmer = DEFAULT_SHOW_SHIMMER,
    showSparkles = DEFAULT_SHOW_SPARKLES,
    showGlow = DEFAULT_SHOW_GLOW,
    shimmerSpeed = DEFAULT_SHIMMER_SPEED,
    glowIntensity = DEFAULT_GLOW_INTENSITY
  } = options

  const shimmerProgress = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const sparkleOpacity = useSharedValue(0)
  const sparkleScale = useSharedValue(1)
  const sparkleRotation = useSharedValue(0)

  useEffect(() => {
    if (!enabled) {
      shimmerProgress.value = 0
      glowOpacity.value = 0
      sparkleOpacity.value = 0
      return
    }

    if (isTruthy(showShimmer)) {
      shimmerProgress.value = withRepeat(
        withTiming(1, {
          duration: shimmerSpeed,
          easing: Easing.linear
        }),
        -1,
        false
      )
    }

    if (isTruthy(showGlow)) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(glowIntensity, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease)
          }),
          withTiming(glowIntensity * 0.5, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease)
          })
        ),
        -1,
        false
      )
    }

    if (isTruthy(showSparkles)) {
      sparkleOpacity.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.ease)
          }),
          withTiming(0.3, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease)
          }),
          withTiming(0, {
            duration: 500,
            easing: Easing.in(Easing.ease)
          })
        ),
        -1,
        false
      )

      sparkleScale.value = withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: 500,
            easing: Easing.out(Easing.back(1.5))
          }),
          withTiming(0.8, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease)
          }),
          withTiming(1, {
            duration: 500,
            easing: Easing.in(Easing.ease)
          })
        ),
        -1,
        false
      )

      sparkleRotation.value = withRepeat(
        withTiming(360, {
          duration: 3000,
          easing: Easing.linear
        }),
        -1,
        false
      )
    }
  }, [
    enabled,
    showShimmer,
    showGlow,
    showSparkles,
    shimmerSpeed,
    glowIntensity,
    shimmerProgress,
    glowOpacity,
    sparkleOpacity,
    sparkleScale,
    sparkleRotation
  ])

  const shimmerStyle = useAnimatedStyle(() => {
    if (!showShimmer || !enabled) {
      return { opacity: 0 }
    }

    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-100, 100],
      Extrapolation.CLAMP
    )

    return {
      opacity: 0.3,
      transform: [{ translateX }]
    }
  })

  const sparkleStyle = useAnimatedStyle(() => {
    if (!showSparkles || !enabled) {
      return { opacity: 0 }
    }

    return {
      opacity: sparkleOpacity.value,
      transform: [
        { scale: sparkleScale.value },
        { rotate: `${String(sparkleRotation.value ?? '')}deg` }
      ]
    }
  })

  const glowStyle = useAnimatedStyle(() => {
    if (!showGlow || !enabled) {
      return { opacity: 0 }
    }

    return {
      opacity: glowOpacity.value
    }
  })

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: enabled ? 1 : 0.95
    }
  })

  return {
    shimmerStyle,
    sparkleStyle,
    glowStyle,
    containerStyle,
    shimmerProgress,
    glowOpacity
  }
}

