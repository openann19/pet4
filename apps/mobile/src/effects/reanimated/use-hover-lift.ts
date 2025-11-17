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
import { isTruthy } from '@petspark/shared';

export interface UseHoverLiftOptions {
  scale?: number
  translateY?: number
  damping?: number
  stiffness?: number
  hapticFeedback?: boolean
}

export interface UseHoverLiftReturn {
  scale: SharedValue<number>
  translateY: SharedValue<number>
  animatedStyle: AnimatedStyle
  handleEnter: () => void
  handleLeave: () => void
  handlePressIn: () => void
  handlePressOut: () => void
}

const DEFAULT_SCALE = 1.05
const DEFAULT_TRANSLATE_Y = -8
const DEFAULT_DAMPING = 25
const DEFAULT_STIFFNESS = 400

export function useHoverLift(options: UseHoverLiftOptions = {}): UseHoverLiftReturn {
  const {
    scale: scaleValue = DEFAULT_SCALE,
    translateY: translateYValue = DEFAULT_TRANSLATE_Y,
    damping = springConfigs.smooth.damping ?? DEFAULT_DAMPING,
    stiffness = springConfigs.smooth.stiffness ?? DEFAULT_STIFFNESS,
    hapticFeedback = false,
  } = options

  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }
  }) as AnimatedStyle

  const handleEnter = useCallback(() => {
    scale.value = withSpring(scaleValue, { damping, stiffness })
    translateY.value = withSpring(translateYValue, { damping, stiffness })
  }, [scale, translateY, scaleValue, translateYValue, damping, stiffness])

  const handleLeave = useCallback(() => {
    scale.value = withSpring(1, { damping, stiffness })
    translateY.value = withSpring(0, { damping, stiffness })
  }, [scale, translateY, damping, stiffness])

  const handlePressIn = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    scale.value = withSpring(scaleValue, { damping, stiffness })
    translateY.value = withSpring(translateYValue, { damping, stiffness })
  }, [scale, translateY, scaleValue, translateYValue, damping, stiffness, hapticFeedback])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping, stiffness })
    translateY.value = withSpring(0, { damping, stiffness })
  }, [scale, translateY, damping, stiffness])

  return {
    scale,
    translateY,
    animatedStyle,
    handleEnter,
    handleLeave,
    handlePressIn,
    handlePressOut,
  }
}
