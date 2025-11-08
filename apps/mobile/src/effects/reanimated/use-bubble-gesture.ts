import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { useCallback, useRef } from 'react'
import * as Haptics from 'expo-haptics'
import { springConfigs, timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseBubbleGestureOptions {
  onPress?: () => void
  onLongPress?: () => void
  hapticFeedback?: boolean
  longPressDelay?: number
}

export interface UseBubbleGestureReturn {
  scale: SharedValue<number>
  glowOpacity: SharedValue<number>
  glowScale: SharedValue<number>
  reactionMenuOpacity: SharedValue<number>
  reactionMenuScale: SharedValue<number>
  reactionMenuTranslateY: SharedValue<number>
  animatedStyle: AnimatedStyle
  glowStyle: AnimatedStyle
  reactionMenuStyle: AnimatedStyle
  handlePressIn: () => void
  handlePressOut: () => void
  handlePress: () => void
  showReactionMenu: () => void
  hideReactionMenu: () => void
}

const DEFAULT_LONG_PRESS_DELAY = 500
const DEFAULT_HAPTIC_FEEDBACK = true

export function useBubbleGesture(options: UseBubbleGestureOptions = {}): UseBubbleGestureReturn {
  const {
    onPress,
    onLongPress,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    longPressDelay = DEFAULT_LONG_PRESS_DELAY,
  } = options

  const scale = useSharedValue(1)
  const glowOpacity = useSharedValue(0)
  const glowScale = useSharedValue(1)
  const reactionMenuOpacity = useSharedValue(0)
  const reactionMenuScale = useSharedValue(0.9)
  const reactionMenuTranslateY = useSharedValue(10)

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isPressedRef = useRef(false)

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [hapticFeedback])

  const triggerLongPressHaptic = useCallback(() => {
    if (hapticFeedback) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }, [hapticFeedback])

  const handlePressIn = useCallback(() => {
    isPressedRef.current = true
    triggerHaptic()

    scale.value = withSpring(0.96, {
      damping: 20,
      stiffness: 500,
    })

    glowOpacity.value = withSpring(0.3, springConfigs.smooth)

    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (isPressedRef.current) {
          triggerLongPressHaptic()
          glowOpacity.value = withSpring(1, springConfigs.smooth)
          glowScale.value = withSpring(1.15, springConfigs.smooth)
          onLongPress()
        }
      }, longPressDelay)
    }
  }, [
    onLongPress,
    longPressDelay,
    triggerHaptic,
    triggerLongPressHaptic,
    scale,
    glowOpacity,
    glowScale,
  ])

  const handlePressOut = useCallback(() => {
    isPressedRef.current = false

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined as unknown as ReturnType<typeof setTimeout>
    }

    scale.value = withSpring(1, springConfigs.smooth)
    glowOpacity.value = withTiming(0, timingConfigs.fast)
    glowScale.value = withTiming(1, timingConfigs.fast)
  }, [scale, glowOpacity, glowScale])

  const handlePress = useCallback(() => {
    if (!isPressedRef.current) {
      return
    }

    scale.value = withSequence(
      withSpring(0.94, {
        damping: 15,
        stiffness: 600,
      }),
      withSpring(1, springConfigs.smooth)
    )

    handlePressOut()

    if (onPress) {
      onPress()
    }
  }, [onPress, scale, handlePressOut])

  const showReactionMenu = useCallback(() => {
    reactionMenuOpacity.value = withSpring(1, springConfigs.smooth)
    reactionMenuScale.value = withSpring(1, springConfigs.bouncy)
    reactionMenuTranslateY.value = withSpring(0, springConfigs.smooth)
  }, [reactionMenuOpacity, reactionMenuScale, reactionMenuTranslateY])

  const hideReactionMenu = useCallback(() => {
    reactionMenuOpacity.value = withTiming(0, timingConfigs.fast)
    reactionMenuScale.value = withTiming(0.9, timingConfigs.fast)
    reactionMenuTranslateY.value = withTiming(10, timingConfigs.fast)
  }, [reactionMenuOpacity, reactionMenuScale, reactionMenuTranslateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  }) as AnimatedStyle

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowOpacity.value, [0, 1], [0, 20], Extrapolation.CLAMP)
    const shadowOpacity = interpolate(glowOpacity.value, [0, 1], [0, 0.5], Extrapolation.CLAMP)

    return {
      opacity: glowOpacity.value,
      transform: [{ scale: glowScale.value }],
      shadowColor: 'rgba(59, 130, 246, 1)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: shadowOpacity,
      shadowRadius: shadowRadius,
      elevation: shadowRadius,
    }
  }) as AnimatedStyle

  const reactionMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: reactionMenuOpacity.value,
      transform: [{ scale: reactionMenuScale.value }, { translateY: reactionMenuTranslateY.value }],
    }
  }) as AnimatedStyle

  return {
    scale,
    glowOpacity,
    glowScale,
    reactionMenuOpacity,
    reactionMenuScale,
    reactionMenuTranslateY,
    animatedStyle,
    glowStyle,
    reactionMenuStyle,
    handlePressIn,
    handlePressOut,
    handlePress,
    showReactionMenu,
    hideReactionMenu,
  }
}
