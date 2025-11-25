import { useSharedValue, useAnimatedStyle, withSpring, type SharedValue } from '@petspark/motion'
import { useCallback } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseMagneticEffectOptions {
  strength?: number
  damping?: number
  stiffness?: number
  enabled?: boolean
}

export interface UseMagneticEffectReturn {
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  animatedStyle: AnimatedStyle
  handleMove: (x: number, y: number) => void
  handleLeave: () => void
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
  } = options

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        transform: [{ translateX: 0 }, { translateY: 0 }],
      }
    }
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }
  }) as AnimatedStyle

  const handleMove = useCallback(
    (x: number, y: number) => {
      if (!enabled) return

      const centerX = 0
      const centerY = 0
      const deltaX = x - centerX
      const deltaY = y - centerY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > 0) {
        const normalizedX = deltaX / distance
        const normalizedY = deltaY / distance
        const magneticX = normalizedX * strength
        const magneticY = normalizedY * strength

        translateX.value = withSpring(magneticX, { damping, stiffness })
        translateY.value = withSpring(magneticY, { damping, stiffness })
      }
    },
    [enabled, strength, damping, stiffness, translateX, translateY]
  )

  const handleLeave = useCallback(() => {
    if (!enabled) return
    translateX.value = withSpring(0, { damping, stiffness })
    translateY.value = withSpring(0, { damping, stiffness })
  }, [enabled, damping, stiffness, translateX, translateY])

  return {
    translateX,
    translateY,
    animatedStyle,
    handleMove,
    handleLeave,
  }
}
