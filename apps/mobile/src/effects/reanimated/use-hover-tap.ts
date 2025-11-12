import type { AnimatedStyle } from './animated-view'
import { useCallback } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { springConfigs } from './transitions'
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseHoverTapOptions {
  pressScale?: number
  tapScale?: number
  damping?: number
  stiffness?: number
  onPress?: () => void
  hapticFeedback?: boolean
}

export interface UseHoverTapReturn {
  scale: SharedValue<number>
  animatedStyle: AnimatedStyle
  handlePressIn: () => void
  handlePressOut: () => void
  handlePress: () => void
}

const DEFAULT_PRESS_SCALE = 1.1
const DEFAULT_TAP_SCALE = 0.95
const DEFAULT_DAMPING = 15
const DEFAULT_STIFFNESS = 400

/**
 * Hook for press and tap interactions on buttons/icons
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useHoverTap(options: UseHoverTapOptions = {}): UseHoverTapReturn {
  const {
    pressScale = DEFAULT_PRESS_SCALE,
    tapScale = DEFAULT_TAP_SCALE,
    damping = springConfigs.snappy.damping ?? DEFAULT_DAMPING,
    stiffness = springConfigs.snappy.stiffness ?? DEFAULT_STIFFNESS,
    onPress,
    hapticFeedback = true,
  } = options

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  }) as AnimatedStyle

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(pressScale, { damping, stiffness })
  }, [scale, pressScale, damping, stiffness])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping, stiffness })
  }, [scale, damping, stiffness])

  const handlePress = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    scale.value = withSpring(tapScale, { damping, stiffness }, () => {
      scale.value = withSpring(1, { damping, stiffness })
    })
    onPress?.()
  }, [scale, tapScale, damping, stiffness, onPress, hapticFeedback])

  return {
    scale,
    animatedStyle,
    handlePressIn,
    handlePressOut,
    handlePress,
  }
}
