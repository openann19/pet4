'use client'

import { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, withTiming, withRepeat, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { useEffect, useCallback } from 'react'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'

export type BubbleVariant = 'ai-answer' | 'user-reply' | 'thread-message' | 'default'

export interface UseBubbleVariantOptions {
  variant: BubbleVariant
  delay?: number
  enabled?: boolean
}

export interface UseBubbleVariantReturn {
  opacity: SharedValue<number>
  translateY: SharedValue<number>
  scale: SharedValue<number>
  glowOpacity: SharedValue<number>
  tilt: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  glowStyle: ReturnType<typeof useAnimatedStyle>
  trigger: () => void
}

const DEFAULT_DELAY = 0

export function useBubbleVariant(
  options: UseBubbleVariantOptions
): UseBubbleVariantReturn {
  const {
    variant,
    delay = DEFAULT_DELAY,
    enabled = true
  } = options

  const opacity = useSharedValue(enabled ? 0 : 1)
  const translateY = useSharedValue(enabled ? 20 : 0)
  const scale = useSharedValue(enabled ? 0.95 : 1)
  const glowOpacity = useSharedValue(0)
  const tilt = useSharedValue(0)

  const trigger = useCallback(() => {
    if (variant === 'ai-answer') {
      opacity.value = withDelay(
        delay,
        withSpring(1, springConfigs.smooth)
      )
      translateY.value = withDelay(
        delay,
        withSpring(0, springConfigs.smooth)
      )
      scale.value = withDelay(
        delay,
        withSpring(1, springConfigs.bouncy)
      )
      glowOpacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: 1500 }),
            withTiming(0.3, { duration: 1500 })
          ),
          -1,
          true
        )
      )
      tilt.value = withDelay(
        delay,
        withSpring(2, springConfigs.smooth)
      )
    } else if (variant === 'user-reply') {
      opacity.value = withDelay(
        delay,
        withTiming(1, timingConfigs.smooth)
      )
      translateY.value = withDelay(
        delay,
        withSequence(
          withSpring(-10, {
            damping: 20,
            stiffness: 500
          }),
          withSpring(0, springConfigs.smooth)
        )
      )
      scale.value = withDelay(
        delay,
        withSequence(
          withSpring(0.85, {
            damping: 20,
            stiffness: 500
          }),
          withSpring(1, springConfigs.smooth)
        )
      )
    } else if (variant === 'thread-message') {
      opacity.value = withDelay(
        delay,
        withSpring(1, springConfigs.smooth)
      )
      translateY.value = withDelay(
        delay,
        withSequence(
          withSpring(-5, {
            damping: 25,
            stiffness: 400
          }),
          withSpring(0, springConfigs.smooth)
        )
      )
      scale.value = withDelay(
        delay,
        withSequence(
          withSpring(0.9, {
            damping: 25,
            stiffness: 400
          }),
          withSpring(1, springConfigs.bouncy)
        )
      )
    } else {
      opacity.value = withDelay(
        delay,
        withSpring(1, springConfigs.smooth)
      )
      translateY.value = withDelay(
        delay,
        withSpring(0, springConfigs.smooth)
      )
      scale.value = withDelay(
        delay,
        withSpring(1, springConfigs.smooth)
      )
    }
  }, [variant, delay, opacity, translateY, scale, glowOpacity, tilt])

  useEffect(() => {
    if (enabled) {
      trigger()
    }
  }, [enabled, variant, trigger])

  const animatedStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      tilt.value,
      [-5, 5],
      [-5, 5],
      Extrapolation.CLAMP
    )

    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotateZ}deg` }
      ]
    }
  })

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(
      glowOpacity.value,
      [0, 1],
      [0, 20],
      Extrapolation.CLAMP
    )

    return {
      opacity: glowOpacity.value,
      boxShadow: `0 0 ${shadowRadius}px rgba(59, 130, 246, ${glowOpacity.value * 0.4})`
    }
  })

  return {
    opacity,
    translateY,
    scale,
    glowOpacity,
    tilt,
    animatedStyle,
    glowStyle,
    trigger
  }
}
