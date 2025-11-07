/**
 * useBubbleTheme
 * Shared animation hook for bubble color theming
 * 
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Chat Effects
 */

import { useCallback, useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { timingConfigs } from '../shared-transitions'
import { useReducedMotionSV } from '../reduced-motion'
import { isTruthy, isDefined } from '@/core/guards';

export type SenderType = 'user' | 'bot' | 'system'
export type MessageType = 'ai-answer' | 'error' | 'system-alert' | 'default'
export type ChatTheme = 'light' | 'dark' | 'glass' | 'cyberpunk'

export interface UseBubbleThemeOptions {
  senderType?: SenderType
  messageType?: MessageType
  theme?: ChatTheme
}

export interface UseBubbleThemeReturn {
  gradientIntensity: SharedValue<number>
  shadowIntensity: SharedValue<number>
  colorIntensity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  updateTheme: (newTheme: ChatTheme) => void
}

export const THEME_COLORS: Record<ChatTheme, { primary: string; secondary: string; shadow: string }> = {
  light: {
    primary: 'rgba(59, 130, 246, 1)',
    secondary: 'rgba(139, 92, 246, 1)',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  dark: {
    primary: 'rgba(96, 165, 250, 1)',
    secondary: 'rgba(167, 139, 250, 1)',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  glass: {
    primary: 'rgba(59, 130, 246, 0.8)',
    secondary: 'rgba(139, 92, 246, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.2)'
  },
  cyberpunk: {
    primary: 'rgba(255, 0, 255, 1)',
    secondary: 'rgba(0, 255, 255, 1)',
    shadow: 'rgba(255, 0, 255, 0.5)'
  }
}

export const SENDER_INTENSITY: Record<SenderType, number> = {
  user: 1,
  bot: 0.7,
  system: 0.5
}

export const MESSAGE_INTENSITY: Record<MessageType, number> = {
  'ai-answer': 0.9,
  error: 1,
  'system-alert': 0.8,
  default: 1
}

const DEFAULT_SENDER_TYPE: SenderType = 'user'
const DEFAULT_MESSAGE_TYPE: MessageType = 'default'
const DEFAULT_THEME: ChatTheme = 'light'

export function useBubbleTheme(
  options: UseBubbleThemeOptions = {}
): UseBubbleThemeReturn {
  const {
    senderType = DEFAULT_SENDER_TYPE,
    messageType = DEFAULT_MESSAGE_TYPE,
    theme = DEFAULT_THEME
  } = options

  const isReducedMotion = useReducedMotionSV()
  const gradientIntensity = useSharedValue(1)
  const shadowIntensity = useSharedValue(1)
  const colorIntensity = useSharedValue(1)

  const updateIntensities = useCallback(() => {
    const senderIntensity = SENDER_INTENSITY[senderType]
    const messageIntensity = MESSAGE_INTENSITY[messageType]
    const targetIntensity = senderIntensity * messageIntensity

    if (isTruthy(isReducedMotion.value)) {
      // Instant update for reduced motion
      gradientIntensity.value = targetIntensity
      shadowIntensity.value = targetIntensity
      colorIntensity.value = targetIntensity
    } else {
      gradientIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
      shadowIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
      colorIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
    }
  }, [senderType, messageType, gradientIntensity, shadowIntensity, colorIntensity, isReducedMotion])

  useEffect(() => {
    updateIntensities()
  }, [updateIntensities])

  const updateTheme = useCallback((_newTheme: ChatTheme) => {
    updateIntensities()
  }, [updateIntensities])

  const animatedStyle = useAnimatedStyle(() => {
    const themeColor = THEME_COLORS[theme]
    const intensity = colorIntensity.value

    const shadowBlur = interpolate(
      shadowIntensity.value,
      [0, 1],
      [0, 20],
      Extrapolation.CLAMP
    )
    const shadowOpacity = interpolate(
      shadowIntensity.value,
      [0, 1],
      [0, 0.3],
      Extrapolation.CLAMP
    )

    // Extract RGB values from rgba strings
    const primaryMatch = themeColor.primary.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    const secondaryMatch = themeColor.secondary.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)

    const primaryR = primaryMatch ? parseInt(primaryMatch[1], 10) : 59
    const primaryG = primaryMatch ? parseInt(primaryMatch[2], 10) : 130
    const primaryB = primaryMatch ? parseInt(primaryMatch[3], 10) : 246

    const secondaryR = secondaryMatch ? parseInt(secondaryMatch[1], 10) : 139
    const secondaryG = secondaryMatch ? parseInt(secondaryMatch[2], 10) : 92
    const secondaryB = secondaryMatch ? parseInt(secondaryMatch[3], 10) : 246

    // Return platform-agnostic style (platform adapters will convert)
    return {
      primaryColor: `rgba(${String(primaryR ?? '')}, ${String(primaryG ?? '')}, ${String(primaryB ?? '')}, ${String(intensity ?? '')})`,
      secondaryColor: `rgba(${String(secondaryR ?? '')}, ${String(secondaryG ?? '')}, ${String(secondaryB ?? '')}, ${String(intensity * 0.8)})`,
      shadowColor: themeColor.shadow,
      shadowBlur,
      shadowOpacity,
      intensity
    }
  })

  return {
    gradientIntensity,
    shadowIntensity,
    colorIntensity,
    animatedStyle,
    updateTheme
  }
}

