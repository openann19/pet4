import { useSharedValue, useAnimatedStyle, withSpring, withSequence, type SharedValue } from 'react-native-reanimated'
import { useCallback } from 'react'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseElasticScaleOptions {
  scaleUp?: number
  scaleDown?: number
  damping?: number
  stiffness?: number
  mass?: number
}

export interface UseElasticScaleReturn {
  scale: SharedValue<number>
  animatedStyle: AnimatedStyle
  handlePressIn: () => void
  handlePressOut: () => void
}

export function useElasticScale(options: UseElasticScaleOptions = {}): UseElasticScaleReturn {
  const {
    scaleUp = 1.15,
    scaleDown = 0.95,
    damping = springConfigs.bouncy.damping ?? 12,
    stiffness = springConfigs.bouncy.stiffness ?? 200,
    mass = 0.8,
  } = options

  const scale = useSharedValue(1)

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleDown, {
      damping,
      stiffness: stiffness * 1.5,
      mass: mass * 0.8,
    })
  }, [scale, scaleDown, damping, stiffness, mass])

  const handlePressOut = useCallback(() => {
    scale.value = withSequence(
      withSpring(scaleUp, {
        damping: damping * 0.6,
        stiffness: stiffness * 1.2,
        mass,
      }),
      withSpring(1, {
        damping,
        stiffness,
        mass,
      })
    )
  }, [scale, scaleUp, damping, stiffness, mass])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  })) as AnimatedStyle

  return {
    scale,
    animatedStyle,
    handlePressIn,
    handlePressOut,
  }
}
