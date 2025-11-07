import { useSharedValue, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated'
import { useCallback } from 'react'
import { PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler'
import { haptic } from '@pet3/motion'
import type { AnimatedStyle } from './animated-view'

export interface UseMagneticEffectOptions {
  strength?: number
  damping?: number
  stiffness?: number
  enabled?: boolean
  hapticFeedback?: boolean
}

export interface UseMagneticEffectReturn {
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  animatedStyle: AnimatedStyle
  onGestureEvent: (event: PanGestureHandlerGestureEvent) => void
  onHandlerStateChange: (event: PanGestureHandlerStateChangeEvent) => void
}

const DEFAULT_STRENGTH = 20
const DEFAULT_DAMPING = 15
const DEFAULT_STIFFNESS = 150

export function useMagneticEffect(options: UseMagneticEffectOptions = {}): UseMagneticEffectReturn {
  const {
    strength = DEFAULT_STRENGTH,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    hapticFeedback = false
  } = options

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        transform: [{ translateX: 0 }, { translateY: 0 }]
      }
    }
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ]
    }
  }) as AnimatedStyle

  const onGestureEvent = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (!enabled) return

    const { translationX, translationY } = event.nativeEvent

    // Calculate magnetic effect based on touch position
    const distance = Math.sqrt(translationX * translationX + translationY * translationY)

    if (distance > 0) {
      const normalizedX = translationX / distance
      const normalizedY = translationY / distance
      const magneticX = normalizedX * Math.min(strength, distance * 0.5)
      const magneticY = normalizedY * Math.min(strength, distance * 0.5)

      translateX.value = withSpring(magneticX, { damping, stiffness })
      translateY.value = withSpring(magneticY, { damping, stiffness })
    }
  }, [enabled, strength, damping, stiffness, translateX, translateY])

  const onHandlerStateChange = useCallback((event: PanGestureHandlerStateChangeEvent) => {
    if (!enabled) return

    if (event.nativeEvent.state === State.BEGAN && hapticFeedback) {
      haptic.light()
    }

    if (event.nativeEvent.state === State.END) {
      // Return to center when gesture ends
      translateX.value = withSpring(0, { damping, stiffness })
      translateY.value = withSpring(0, { damping, stiffness })
    }
  }, [enabled, hapticFeedback, damping, stiffness, translateX, translateY])

  return {
    translateX,
    translateY,
    animatedStyle,
    onGestureEvent,
    onHandlerStateChange
  }
}
