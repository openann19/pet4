'use client'

import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, withSequence, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { useEffect, useCallback, useRef } from 'react'
import { haptics } from '@/lib/haptics'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseMessageBubbleAnimationOptions {
  index?: number
  staggerDelay?: number
  isHighlighted?: boolean
  isNew?: boolean
  highlightedColor?: string
  onPress?: () => void
  onLongPress?: () => void
  hapticFeedback?: boolean
}

export interface UseMessageBubbleAnimationReturn {
  opacity: SharedValue<number>
  translateY: SharedValue<number>
  scale: SharedValue<number>
  glowOpacity: SharedValue<number>
  glowScale: SharedValue<number>
  backgroundOpacity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  glowStyle: ReturnType<typeof useAnimatedStyle>
  backgroundStyle: ReturnType<typeof useAnimatedStyle>
  handlePress: () => void
  handlePressIn: () => void
  handlePressOut: () => void
  handleLongPressStart: () => void
  handleLongPressEnd: () => void
  animateReaction: (emoji: string) => void
  animateHighlight: () => void
}

const DEFAULT_STAGGER_DELAY = 50
const DEFAULT_HIGHLIGHT_COLOR = 'rgba(255, 215, 0, 0.3)'

export function useMessageBubbleAnimation(
  options: UseMessageBubbleAnimationOptions = {}
): UseMessageBubbleAnimationReturn {
  const {
    index = 0,
    staggerDelay = DEFAULT_STAGGER_DELAY,
    isHighlighted = false,
    isNew = true,
    highlightedColor = DEFAULT_HIGHLIGHT_COLOR,
    onPress,
    onLongPress,
    hapticFeedback = true
  } = options

  const opacity = useSharedValue(isNew ? 0 : 1)
  const translateY = useSharedValue(isNew ? 20 : 0)
  const scale = useSharedValue(1)
  const glowOpacity = useSharedValue(0)
  const glowScale = useSharedValue(1)
  const backgroundOpacity = useSharedValue(0)
  const reactionScale = useSharedValue(1)
  const reactionTranslateY = useSharedValue(0)
  const reactionOpacity = useSharedValue(0)

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isPressedRef = useRef(false)

  useEffect(() => {
    if (isTruthy(isNew)) {
      const delay = index * staggerDelay
      opacity.value = withDelay(delay, withSpring(1, springConfigs.smooth))
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 25,
          stiffness: 400
        })
      )
    }

    return () => {
      if (isTruthy(longPressTimerRef.current)) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [isNew, index, staggerDelay, opacity, translateY])

  useEffect(() => {
    if (isTruthy(isHighlighted)) {
      backgroundOpacity.value = withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(2000, withTiming(0, timingConfigs.smooth))
      )
    } else {
      backgroundOpacity.value = withTiming(0, timingConfigs.fast)
    }
  }, [isHighlighted, backgroundOpacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ]
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
      boxShadow: `0 0 ${String(shadowRadius ?? '')}px rgba(59, 130, 246, ${String(shadowOpacity ?? '')})`
    }
  })

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: backgroundOpacity.value > 0 ? highlightedColor : 'transparent',
      opacity: backgroundOpacity.value
    }
  })

  const triggerHaptic = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      haptics.selection()
    }
  }, [hapticFeedback])

  const triggerLongPress = useCallback(() => {
    if (isTruthy(onLongPress)) {
      onLongPress()
    }
  }, [onLongPress])

  const handlePressIn = useCallback(() => {
    triggerHaptic()
    isPressedRef.current = true
    scale.value = withSpring(0.96, {
      damping: 20,
      stiffness: 500
    })
    glowOpacity.value = withSpring(1, springConfigs.smooth)
    glowScale.value = withSpring(1.05, springConfigs.smooth)

    if (isTruthy(onLongPress)) {
      longPressTimerRef.current = setTimeout(() => {
        if (isTruthy(isPressedRef.current)) {
          triggerLongPress()
        }
      }, 500)
    }
  }, [scale, glowOpacity, glowScale, onLongPress, triggerHaptic, triggerLongPress])

  const handlePressOut = useCallback(() => {
    isPressedRef.current = false
    if (isTruthy(longPressTimerRef.current)) {
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

    if (isTruthy(onPress)) {
      onPress()
    }

    scale.value = withSequence(
      withSpring(0.94, {
        damping: 15,
        stiffness: 600
      }),
      withSpring(1, springConfigs.smooth)
    )

    handlePressOut()
  }, [onPress, scale, handlePressOut])

  const handleLongPressStart = useCallback(() => {
    handlePressIn()
  }, [handlePressIn])

  const handleLongPressEnd = useCallback(() => {
    handlePressOut()
  }, [handlePressOut])

  const animateReaction = useCallback((_emoji: string) => {
    reactionScale.value = 1
    reactionTranslateY.value = 0
    reactionOpacity.value = 1

    reactionScale.value = withSequence(
      withSpring(1.5, {
        damping: 10,
        stiffness: 400
      }),
      withSpring(1.2, springConfigs.bouncy)
    )

    reactionTranslateY.value = withTiming(-30, {
      duration: 800
    })

    reactionOpacity.value = withSequence(
      withTiming(1, timingConfigs.fast),
      withDelay(400, withTiming(0, timingConfigs.smooth))
    )

    triggerHaptic()
  }, [reactionScale, reactionTranslateY, reactionOpacity, triggerHaptic])

  const animateHighlight = useCallback(() => {
    backgroundOpacity.value = withSequence(
      withTiming(1, timingConfigs.fast),
      withDelay(1500, withTiming(0, timingConfigs.smooth))
    )
  }, [backgroundOpacity])

  return {
    opacity,
    translateY,
    scale,
    glowOpacity,
    glowScale,
    backgroundOpacity,
    animatedStyle,
    glowStyle,
    backgroundStyle,
    handlePress,
    handlePressIn,
    handlePressOut,
    handleLongPressStart,
    handleLongPressEnd,
    animateReaction,
    animateHighlight
  }
}
