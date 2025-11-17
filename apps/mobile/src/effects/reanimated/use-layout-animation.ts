/**
 * Mobile Adapter: useLayoutAnimation
 * Layout change animations for mobile using Reanimated Layout Animations
 */

import { useEffect, useRef } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue
} from 'react-native-reanimated'
import type { LayoutChangeEvent } from 'react-native'
import { springConfigs } from './transitions'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseLayoutAnimationOptions {
  enabled?: boolean
  springConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
  onLayoutChange?: () => void
}

export interface UseLayoutAnimationReturn {
  x: SharedValue<number>
  y: SharedValue<number>
  width: SharedValue<number>
  height: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  onLayout: (event: LayoutChangeEvent) => void
}

export function useLayoutAnimation(
  options: UseLayoutAnimationOptions = {}
): UseLayoutAnimationReturn {
  const {
    enabled = true,
    springConfig = springConfigs.smooth,
    onLayoutChange
  } = options

  const isReducedMotion = useReducedMotionSV()
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const width = useSharedValue(0)
  const height = useSharedValue(0)
  const previousLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const onLayout = (event: LayoutChangeEvent) => {
    if (!enabled) return

    const { x: layoutX, y: layoutY, width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout
    const newLayout = {
      x: layoutX,
      y: layoutY,
      width: layoutWidth,
      height: layoutHeight
    }

    const prevLayout = previousLayoutRef.current

    if (!prevLayout) {
      x.value = newLayout.x
      y.value = newLayout.y
      width.value = newLayout.width
      height.value = newLayout.height
      previousLayoutRef.current = newLayout
      return
    }

    if (
      prevLayout.x !== newLayout.x ||
      prevLayout.y !== newLayout.y ||
      prevLayout.width !== newLayout.width ||
      prevLayout.height !== newLayout.height
    ) {
      if (isTruthy(isReducedMotion.value)) {
        x.value = newLayout.x
        y.value = newLayout.y
        width.value = newLayout.width
        height.value = newLayout.height
      } else {
        x.value = withSpring(newLayout.x, springConfig)
        y.value = withSpring(newLayout.y, springConfig)
        width.value = withSpring(newLayout.width, springConfig)
        height.value = withSpring(newLayout.height, springConfig)
      }
      previousLayoutRef.current = newLayout
      onLayoutChange?.()
    }
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value }
      ],
      width: width.value,
      height: height.value
    }
  })

  return {
    x,
    y,
    width,
    height,
    animatedStyle,
    onLayout
  }
}

