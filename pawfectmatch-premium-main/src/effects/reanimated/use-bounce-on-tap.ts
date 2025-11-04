'use client'

import { useSharedValue, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated'
import { useCallback } from 'react'
import { haptics } from '@/lib/haptics'

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
  animatedStyle: ReturnType<typeof useAnimatedStyle>
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
  })

  const handlePress = useCallback(() => {
    if (hapticFeedback) {
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

