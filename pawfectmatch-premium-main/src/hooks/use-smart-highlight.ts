'use client'

import { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { useEffect, useCallback } from 'react'
import { timingConfigs } from '@/effects/reanimated/transitions'

export interface UseSmartHighlightOptions {
  isHighlighted?: boolean
  highlightColor?: string
  glowColor?: string
  duration?: number
  glowRadius?: number
}

export interface UseSmartHighlightReturn {
  backgroundOpacity: SharedValue<number>
  glowOpacity: SharedValue<number>
  glowRadius: SharedValue<number>
  backgroundStyle: ReturnType<typeof useAnimatedStyle>
  glowStyle: ReturnType<typeof useAnimatedStyle>
  trigger: () => void
}

const DEFAULT_HIGHLIGHT_COLOR = 'rgba(255, 215, 0, 0.3)'
const DEFAULT_GLOW_COLOR = 'rgba(59, 130, 246, 0.6)'
const DEFAULT_DURATION = 2000
const DEFAULT_GLOW_RADIUS = 20

export function useSmartHighlight(
  options: UseSmartHighlightOptions = {}
): UseSmartHighlightReturn {
  const {
    isHighlighted = false,
    highlightColor = DEFAULT_HIGHLIGHT_COLOR,
    glowColor = DEFAULT_GLOW_COLOR,
    duration = DEFAULT_DURATION,
    glowRadius = DEFAULT_GLOW_RADIUS
  } = options

  const backgroundOpacity = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const glowRadiusValue = useSharedValue(0)

  useEffect(() => {
    if (isHighlighted) {
      trigger()
    }
  }, [isHighlighted])

  const trigger = useCallback(() => {
    backgroundOpacity.value = withSequence(
      withTiming(1, timingConfigs.fast),
      withDelay(duration - 400, withTiming(0, timingConfigs.smooth))
    )

    glowOpacity.value = withSequence(
      withTiming(1, timingConfigs.fast),
      withDelay(300, withTiming(0, timingConfigs.smooth))
    )

    glowRadiusValue.value = withSequence(
      withTiming(glowRadius, timingConfigs.fast),
      withDelay(300, withTiming(0, timingConfigs.fast))
    )
  }, [backgroundOpacity, glowOpacity, glowRadiusValue, duration, glowRadius])

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: highlightColor,
      opacity: backgroundOpacity.value
    }
  })

  const glowStyle = useAnimatedStyle(() => {
    const radius = interpolate(
      glowRadiusValue.value,
      [0, glowRadius],
      [0, glowRadius],
      Extrapolation.CLAMP
    )

    return {
      opacity: glowOpacity.value,
      boxShadow: `0 0 ${radius}px ${glowColor}`
    }
  })

  return {
    backgroundOpacity,
    glowOpacity,
    glowRadius: glowRadiusValue,
    backgroundStyle,
    glowStyle,
    trigger
  }
}

