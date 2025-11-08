import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'
import { useState, useCallback } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseMagneticPressOptions {
  strength?: number
  damping?: number
  stiffness?: number
  maxDistance?: number
  enabled?: boolean
  hapticFeedback?: boolean
}

export interface UseMagneticPressReturn {
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  scale: SharedValue<number>
  animatedStyle: AnimatedStyle
  handlePressIn: () => void
  handlePressOut: () => void
  handleLayout: (event: LayoutChangeEvent) => void
}

export function useMagneticPress(options: UseMagneticPressOptions = {}): UseMagneticPressReturn {
  const {
    strength: _strength = 0.3,
    damping = springConfigs.smooth.damping ?? 20,
    stiffness = springConfigs.smooth.stiffness ?? 150,
    maxDistance: _maxDistance = 50,
    enabled = true,
    hapticFeedback: _hapticFeedback = false,
  } = options

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const [_elementLayout, setElementLayout] = useState<{
    width: number
    height: number
    x: number
    y: number
  } | null>(null)

  const handlePressIn = useCallback(() => {
    if (!enabled) return
    scale.value = withSpring(1.05, { damping, stiffness })
  }, [enabled, damping, stiffness, scale])

  const handlePressOut = useCallback(() => {
    if (!enabled) return
    translateX.value = withSpring(0, { damping, stiffness })
    translateY.value = withSpring(0, { damping, stiffness })
    scale.value = withSpring(1, { damping, stiffness })
  }, [enabled, damping, stiffness, translateX, translateY, scale])

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height, x, y } = event.nativeEvent.layout
    setElementLayout({ width, height, x, y })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  })) as AnimatedStyle

  return {
    translateX,
    translateY,
    scale,
    animatedStyle,
    handlePressIn,
    handlePressOut,
    handleLayout,
  }
}
