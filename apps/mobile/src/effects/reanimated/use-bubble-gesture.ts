/**
 * Mobile Adapter: useBubbleGesture
 * Bubble gesture animations for mobile (press, long press, reaction menu)
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  type SharedValue
} from 'react-native-reanimated'
import { useCallback, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { haptic } from '@petspark/motion'
import { springConfigs, timingConfigs } from './transitions'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@/core/guards';

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
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  glowStyle: ReturnType<typeof useAnimatedStyle>
  reactionMenuStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Press>
  showReactionMenu: () => void
  hideReactionMenu: () => void
}

const DEFAULT_LONG_PRESS_DELAY = 500
const DEFAULT_HAPTIC_FEEDBACK = true

export function useBubbleGesture(
  options: UseBubbleGestureOptions = {}
): UseBubbleGestureReturn {
  const {
    onPress,
    onLongPress,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    longPressDelay = DEFAULT_LONG_PRESS_DELAY
  } = options

  const isReducedMotion = useReducedMotionSV()
  const scale = useSharedValue(1)
  const glowOpacity = useSharedValue(0)
  const glowScale = useSharedValue(1)
  const reactionMenuOpacity = useSharedValue(0)
  const reactionMenuScale = useSharedValue(0.9)
  const reactionMenuTranslateY = useSharedValue(10)

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isPressedRef = useRef(false)

  const triggerHaptic = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      haptic.selection()
    }
  }, [hapticFeedback])

  const triggerLongPressHaptic = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      haptic.medium()
    }
  }, [hapticFeedback])

  const handlePressIn = useCallback(() => {
    isPressedRef.current = true
    triggerHaptic()

    if (isTruthy(isReducedMotion.value)) {
      scale.value = 0.96
      glowOpacity.value = 0.3
    } else {
      scale.value = withSpring(0.96, {
        damping: 20,
        stiffness: 500
      })
      glowOpacity.value = withSpring(0.3, springConfigs.smooth)
    }

    if (isTruthy(onLongPress)) {
      longPressTimerRef.current = setTimeout(() => {
        if (isTruthy(isPressedRef.current)) {
          triggerLongPressHaptic()
          if (isTruthy(isReducedMotion.value)) {
            glowOpacity.value = 1
            glowScale.value = 1.15
          } else {
            glowOpacity.value = withSpring(1, springConfigs.smooth)
            glowScale.value = withSpring(1.15, springConfigs.smooth)
          }
          onLongPress()
        }
      }, longPressDelay)
    }
  }, [onLongPress, longPressDelay, triggerHaptic, triggerLongPressHaptic, scale, glowOpacity, glowScale, isReducedMotion])

  const handlePressOut = useCallback(() => {
    isPressedRef.current = false

    if (isTruthy(longPressTimerRef.current)) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined as unknown as ReturnType<typeof setTimeout>
    }

    if (isTruthy(isReducedMotion.value)) {
      scale.value = 1
      glowOpacity.value = 0
      glowScale.value = 1
    } else {
      scale.value = withSpring(1, springConfigs.smooth)
      glowOpacity.value = withTiming(0, timingConfigs.fast)
      glowScale.value = withTiming(1, timingConfigs.fast)
    }
  }, [scale, glowOpacity, glowScale, isReducedMotion])

  const handlePress = useCallback(() => {
    if (!isPressedRef.current) {
      return
    }

    if (isTruthy(isReducedMotion.value)) {
      scale.value = 0.94
      setTimeout(() => {
        scale.value = 1
      }, 100)
    } else {
      scale.value = withSequence(
        withSpring(0.94, {
          damping: 15,
          stiffness: 600
        }),
        withSpring(1, springConfigs.smooth)
      )
    }

    handlePressOut()

    if (isTruthy(onPress)) {
      onPress()
    }
  }, [onPress, scale, handlePressOut, isReducedMotion])

  const gesture = Gesture.Press()
    .onStart(handlePressIn)
    .onEnd(handlePress)
    .minDuration(longPressDelay)

  const showReactionMenu = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      reactionMenuOpacity.value = 1
      reactionMenuScale.value = 1
      reactionMenuTranslateY.value = 0
    } else {
      reactionMenuOpacity.value = withSpring(1, springConfigs.smooth)
      reactionMenuScale.value = withSpring(1, springConfigs.bouncy)
      reactionMenuTranslateY.value = withSpring(0, springConfigs.smooth)
    }
  }, [reactionMenuOpacity, reactionMenuScale, reactionMenuTranslateY, isReducedMotion])

  const hideReactionMenu = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      reactionMenuOpacity.value = 0
      reactionMenuScale.value = 0.9
      reactionMenuTranslateY.value = 10
    } else {
      reactionMenuOpacity.value = withTiming(0, timingConfigs.fast)
      reactionMenuScale.value = withTiming(0.9, timingConfigs.fast)
      reactionMenuTranslateY.value = withTiming(10, timingConfigs.fast)
    }
  }, [reactionMenuOpacity, reactionMenuScale, reactionMenuTranslateY, isReducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    }
  })

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(
      glowOpacity.value,
      [0, 1],
      [0, 20],
      Extrapolation.CLAMP
    )
    const shadowOpacity = interpolate(
      glowOpacity.value,
      [0, 1],
      [0, 0.5],
      Extrapolation.CLAMP
    )

    return {
      opacity: glowOpacity.value,
      transform: [{ scale: glowScale.value }],
      shadowColor: 'rgba(59, 130, 246, 1)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: shadowRadius / 2, // Android
    }
  })

  const reactionMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: reactionMenuOpacity.value,
      transform: [
        { scale: reactionMenuScale.value },
        { translateY: reactionMenuTranslateY.value }
      ]
    }
  })

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
    gesture,
    showReactionMenu,
    hideReactionMenu
  }
}

