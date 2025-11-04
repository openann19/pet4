'use client'

import {
  useSharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useMemo } from 'react'

export interface UseBubbleMoodThemeOptions {
  text: string
  enabled?: boolean
}

export interface UseBubbleMoodThemeReturn {
  backgroundColor: string
  gradientFrom: string
  gradientTo: string
  opacity: number
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

const POSITIVE_KEYWORDS = [
  'happy', 'excited', 'love', 'great', 'awesome', 'amazing', 'wonderful',
  'fantastic', 'perfect', 'brilliant', 'excellent', 'joy', 'smile', 'laugh',
  'haha', 'yay', 'woohoo', 'yes', 'yep', 'sure', 'definitely', 'absolutely'
]

const NEGATIVE_KEYWORDS = [
  'sad', 'angry', 'upset', 'bad', 'terrible', 'awful', 'hate', 'disappointed',
  'frustrated', 'worried', 'anxious', 'stressed', 'no', 'nope', 'never',
  'stop', 'wrong', 'error', 'problem', 'issue', 'difficult', 'hard'
]

const POSITIVE_COLORS = {
  bg: 'rgba(34, 197, 94, 0.15)',
  from: 'rgba(34, 197, 94, 0.2)',
  to: 'rgba(16, 185, 129, 0.15)',
  opacity: 0.3
}

const NEGATIVE_COLORS = {
  bg: 'rgba(239, 68, 68, 0.15)',
  from: 'rgba(239, 68, 68, 0.2)',
  to: 'rgba(220, 38, 38, 0.15)',
  opacity: 0.3
}

const NEUTRAL_COLORS = {
  bg: 'transparent',
  from: 'transparent',
  to: 'transparent',
  opacity: 0
}

const DEFAULT_ENABLED = true

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)
  
  let positiveScore = 0
  let negativeScore = 0

  words.forEach((word) => {
    if (POSITIVE_KEYWORDS.some((keyword) => word.includes(keyword))) {
      positiveScore++
    }
    if (NEGATIVE_KEYWORDS.some((keyword) => word.includes(keyword))) {
      negativeScore++
    }
  })

  if (positiveScore > negativeScore && positiveScore > 0) {
    return 'positive'
  }
  if (negativeScore > positiveScore && negativeScore > 0) {
    return 'negative'
  }
  return 'neutral'
}

export function useBubbleMoodTheme(
  options: UseBubbleMoodThemeOptions
): UseBubbleMoodThemeReturn {
  const { text, enabled = DEFAULT_ENABLED } = options

  const sentiment = useMemo(() => {
    if (!enabled || !text) {
      return 'neutral'
    }
    return analyzeSentiment(text)
  }, [text, enabled])

  const colors = useMemo(() => {
    switch (sentiment) {
      case 'positive':
        return POSITIVE_COLORS
      case 'negative':
        return NEGATIVE_COLORS
      default:
        return NEUTRAL_COLORS
    }
  }, [sentiment])

  const opacity = useSharedValue(colors.opacity)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: colors.bg,
      opacity: opacity.value
    }
  })

  return {
    backgroundColor: colors.bg,
    gradientFrom: colors.from,
    gradientTo: colors.to,
    opacity: colors.opacity,
    animatedStyle
  }
}

