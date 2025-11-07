/**
 * Mobile Adapter: useBubbleTheme
 * Optimized bubble theme animations for mobile platform
 */

import { useBubbleTheme as useSharedBubbleTheme, type UseBubbleThemeOptions, type ChatTheme } from '@petspark/motion'
import { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated'

export type { SenderType, MessageType, ChatTheme } from '@petspark/motion'

export interface MobileBubbleThemeOptions extends UseBubbleThemeOptions {
  /**
   * Use native driver for better performance
   * @default true
   */
  useNativeDriver?: boolean

  /**
   * Optimize for screen reader accessibility
   * @default true
   */
  accessibilityOptimized?: boolean
}

export interface UseBubbleThemeReturn {
  gradientIntensity: SharedValue<number>
  shadowIntensity: SharedValue<number>
  colorIntensity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  updateTheme: (newTheme: ChatTheme) => void
  // Mobile-specific additions
  gradientColors: ReturnType<typeof useDerivedValue<[string, string]>>
}

export function useBubbleTheme(
  options: MobileBubbleThemeOptions = {}
): UseBubbleThemeReturn {
  const {
    useNativeDriver = true,
    accessibilityOptimized = true,
    ...sharedOptions
  } = options

  const shared = useSharedBubbleTheme(sharedOptions)

  // Convert shared style to mobile-compatible style
  const animatedStyle = useAnimatedStyle(() => {
    const sharedStyle = shared.animatedStyle.value as any

    return {
      shadowColor: sharedStyle.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: sharedStyle.shadowOpacity,
      shadowRadius: sharedStyle.shadowBlur,
      elevation: sharedStyle.shadowBlur / 2, // Android elevation
    }
  })

  // Extract gradient colors for LinearGradient component
  const gradientColors = useDerivedValue(() => {
    const sharedStyle = shared.animatedStyle.value as any
    return [
      sharedStyle.primaryColor,
      sharedStyle.secondaryColor,
    ] as [string, string]
  })

  return {
    gradientIntensity: shared.gradientIntensity,
    shadowIntensity: shared.shadowIntensity,
    colorIntensity: shared.colorIntensity,
    animatedStyle,
    updateTheme: shared.updateTheme,
    gradientColors,
  }
}

