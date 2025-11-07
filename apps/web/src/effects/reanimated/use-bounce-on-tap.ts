'use client'

import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { haptics } from '@/lib/haptics'
import { useCallback } from 'react'
import { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseBounceOnTapOptions {
  scale?: number
  duration?: number
  damping?: number
  stiffness?: number
  onPress?: () => void
  hapticFeedback?: boolean
}

export interface UseBounceOnTapReturn {
  scale: SharedValue<number>
  animatedStyle: AnimatedStyle
  handlePress: () => void
}

const DEFAULT_SCALE = 0.95
const DEFAULT_DAMPING = 15
const DEFAULT_STIFFNESS = 400

export function useBounceOnTap(options: UseBounceOnTapOptions = {}): UseBounceOnTapReturn {
  const {
    scale: scaleValue = DEFAULT_SCALE,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    onPress,
    hapticFeedback = true
  } = options

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    }
  }) as AnimatedStyle

  const handlePress = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      haptics.impact('light')
    }
    
    scale.value = withSpring(scaleValue, {
      damping,
      stiffness
    }, () => {
      scale.value = withSpring(1, {
        damping,
        stiffness
      })
    })

    onPress?.()
  }, [scale, scaleValue, damping, stiffness, onPress, hapticFeedback])

  return {
    scale,
    animatedStyle,
    handlePress
  }
}

