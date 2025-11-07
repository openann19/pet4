'use client'

import { useMemo } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { useUIConfig } from '@/hooks/useUIConfig'
import { springConfigs } from '@/effects/reanimated/transitions'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseMoodColorThemeOptions {
  text: string
  enabled?: boolean
}

export interface UseMoodColorThemeReturn {
  animatedStyle: AnimatedStyle
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

const POSITIVE_COLORS = {
  primary: 'rgba(34, 197, 94, 0.2)',
  secondary: 'rgba(16, 185, 129, 0.15)',
  accent: 'rgba(110, 231, 183, 0.3)'
}

const NEGATIVE_COLORS = {
  primary: 'rgba(239, 68, 68, 0.2)',
  secondary: 'rgba(220, 38, 38, 0.15)',
  accent: 'rgba(251, 146, 60, 0.3)'
}

const NEUTRAL_COLORS = {
  primary: 'rgba(148, 163, 184, 0.15)',
  secondary: 'rgba(203, 213, 225, 0.1)',
  accent: 'rgba(100, 116, 139, 0.2)'
}

/**
 * Mood-based color theme based on message text sentiment
 * 
 * Analyzes text sentiment and applies adaptive color scheme
 * 
 * @example
 * ```tsx
 * const { animatedStyle, colors } = useMoodColorTheme({ text: messageText })
 * return <AnimatedView style={[animatedStyle, { backgroundColor: colors.primary }]}>{content}</AnimatedView>
 * ```
 */
export function useMoodColorTheme(
  options: UseMoodColorThemeOptions
): UseMoodColorThemeReturn {
  const { text, enabled = true } = options
  const { theme } = useUIConfig()

  const colors = useMemo(() => {
    if (!enabled || !theme.adaptiveMood) {
      return NEUTRAL_COLORS
    }

    const positiveWords = ['happy', 'love', 'great', 'amazing', 'wonderful', 'excited', 'joy']
    const negativeWords = ['sad', 'bad', 'hate', 'terrible', 'awful', 'angry', 'upset']

    const lowerText = text.toLowerCase()
    const hasPositive = positiveWords.some((word) => lowerText.includes(word))
    const hasNegative = negativeWords.some((word) => lowerText.includes(word))

    if (isTruthy(hasPositive)) {
      return POSITIVE_COLORS
    }

    if (isTruthy(hasNegative)) {
      return NEGATIVE_COLORS
    }

    return NEUTRAL_COLORS
  }, [text, enabled, theme.adaptiveMood])

  const colorOpacity = useSharedValue(0)

  if (enabled && theme.adaptiveMood) {
    colorOpacity.value = withSpring(1, springConfigs.smooth)
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !theme.adaptiveMood) {
      return {}
    }

    return {
      backgroundColor: colors.primary,
      opacity: colorOpacity.value
    }
  }) as AnimatedStyle

  return {
    animatedStyle,
    colors
  }
}

