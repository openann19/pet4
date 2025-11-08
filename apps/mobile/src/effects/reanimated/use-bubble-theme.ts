import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { useEffect, useCallback } from 'react'
import { timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

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
  animatedStyle: AnimatedStyle
  themeColors: { primary: string; secondary: string; shadow: string }
  updateTheme: (newTheme: ChatTheme) => void
}

const THEME_COLORS: Record<ChatTheme, { primary: string; secondary: string; shadow: string }> = {
  light: {
    primary: 'rgba(59, 130, 246, 1)',
    secondary: 'rgba(139, 92, 246, 1)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: 'rgba(96, 165, 250, 1)',
    secondary: 'rgba(167, 139, 250, 1)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  glass: {
    primary: 'rgba(59, 130, 246, 0.8)',
    secondary: 'rgba(139, 92, 246, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.2)',
  },
  cyberpunk: {
    primary: 'rgba(255, 0, 255, 1)',
    secondary: 'rgba(0, 255, 255, 1)',
    shadow: 'rgba(255, 0, 255, 0.5)',
  },
}

const SENDER_INTENSITY: Record<SenderType, number> = {
  user: 1,
  bot: 0.7,
  system: 0.5,
}

const MESSAGE_INTENSITY: Record<MessageType, number> = {
  'ai-answer': 0.9,
  error: 1,
  'system-alert': 0.8,
  default: 1,
}

const DEFAULT_SENDER_TYPE: SenderType = 'user'
const DEFAULT_MESSAGE_TYPE: MessageType = 'default'
const DEFAULT_THEME: ChatTheme = 'light'

export function useBubbleTheme(options: UseBubbleThemeOptions = {}): UseBubbleThemeReturn {
  const {
    senderType = DEFAULT_SENDER_TYPE,
    messageType = DEFAULT_MESSAGE_TYPE,
    theme = DEFAULT_THEME,
  } = options

  const gradientIntensity = useSharedValue(1)
  const shadowIntensity = useSharedValue(1)
  const colorIntensity = useSharedValue(1)

  useEffect(() => {
    const senderIntensity = SENDER_INTENSITY[senderType]
    const messageIntensity = MESSAGE_INTENSITY[messageType]
    const targetIntensity = senderIntensity * messageIntensity

    gradientIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
    shadowIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
    colorIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
  }, [senderType, messageType, gradientIntensity, shadowIntensity, colorIntensity])

  const updateTheme = useCallback(
    (_newTheme: ChatTheme) => {
      const senderIntensity = SENDER_INTENSITY[senderType]
      const messageIntensity = MESSAGE_INTENSITY[messageType]
      const targetIntensity = senderIntensity * messageIntensity

      gradientIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
      shadowIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
      colorIntensity.value = withTiming(targetIntensity, timingConfigs.smooth)
    },
    [senderType, gradientIntensity, shadowIntensity, colorIntensity]
  )

  const themeColors = THEME_COLORS[theme]

  const animatedStyle = useAnimatedStyle(() => {
    const intensity = colorIntensity.value

    const shadowBlur = interpolate(shadowIntensity.value, [0, 1], [0, 20], Extrapolation.CLAMP)
    const shadowOpacity = interpolate(shadowIntensity.value, [0, 1], [0, 0.3], Extrapolation.CLAMP)

    // Extract RGB values from theme colors
    const primaryMatch = themeColors.primary.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    const primaryR = primaryMatch?.[1] ? parseInt(primaryMatch[1], 10) : 59
    const primaryG = primaryMatch?.[2] ? parseInt(primaryMatch[2], 10) : 130
    const primaryB = primaryMatch?.[3] ? parseInt(primaryMatch[3], 10) : 246

    // For React Native, we'll use backgroundColor with primary color
    // Gradient should be handled by LinearGradient component separately
    return {
      backgroundColor: `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${intensity})`,
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: shadowOpacity,
      shadowRadius: shadowBlur,
      elevation: shadowBlur,
    }
  }) as AnimatedStyle

  return {
    gradientIntensity,
    shadowIntensity,
    colorIntensity,
    animatedStyle,
    themeColors,
    updateTheme,
  }
}
