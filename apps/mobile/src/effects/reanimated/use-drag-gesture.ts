/**
 * Mobile Adapter: useDragGesture
 * Drag gesture implementation using react-native-gesture-handler
 */

import { useCallback, useRef } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated'
import { Gesture } from 'react-native-gesture-handler'
import { springConfigs, timingConfigs } from './transitions'
import { haptic } from '@petspark/motion'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseDragGestureOptions {
  enabled?: boolean
  axis?: 'x' | 'y' | 'both'
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  onDragStart?: () => void
  onDrag?: (x: number, y: number) => void
  onDragEnd?: (x: number, y: number) => void
  hapticFeedback?: boolean
  snapBack?: boolean
  snapBackDuration?: number
}

export interface UseDragGestureReturn {
  x: SharedValue<number>
  y: SharedValue<number>
  isDragging: SharedValue<boolean>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Pan>
  reset: () => void
}

export function useDragGesture(
  options: UseDragGestureOptions = {}
): UseDragGestureReturn {
  const {
    enabled = true,
    axis = 'both',
    bounds,
    onDragStart,
    onDrag,
    onDragEnd,
    hapticFeedback = true,
    snapBack = false,
    snapBackDuration = timingConfigs.smooth.duration ?? 300
  } = options

  const isReducedMotion = useReducedMotionSV()
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const isDragging = useSharedValue(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const offsetXRef = useRef(0)
  const offsetYRef = useRef(0)

  const constrainValue = useCallback((value: number, min?: number, max?: number): number => {
    if (min !== undefined && value < min) return min
    if (max !== undefined && value > max) return max
    return value
  }, [])

  const getConstrainedX = useCallback((newX: number): number => {
    if (bounds?.left !== undefined || bounds?.right !== undefined) {
      return constrainValue(newX, bounds.left, bounds.right)
    }
    return newX
  }, [bounds, constrainValue])

  const getConstrainedY = useCallback((newY: number): number => {
    if (bounds?.top !== undefined || bounds?.bottom !== undefined) {
      return constrainValue(newY, bounds.top, bounds.bottom)
    }
    return newY
  }, [bounds, constrainValue])

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      if (!enabled) return
      isDragging.value = true
      startXRef.current = x.value
      startYRef.current = y.value
      offsetXRef.current = x.value
      offsetYRef.current = y.value

      if (isTruthy(hapticFeedback)) {
        haptic.selection()
      }

      onDragStart?.()
    })
    .onUpdate((e) => {
      if (!enabled || isReducedMotion.value) return

      const deltaX = e.translationX
      const deltaY = e.translationY

      let newX = offsetXRef.current
      let newY = offsetYRef.current

      if (axis === 'x' || axis === 'both') {
        newX = getConstrainedX(offsetXRef.current + deltaX)
        x.value = newX
      }

      if (axis === 'y' || axis === 'both') {
        newY = getConstrainedY(offsetYRef.current + deltaY)
        y.value = newY
      }

      onDrag?.(newX, newY)
    })
    .onEnd(() => {
      if (!enabled) return

      isDragging.value = false

      const finalX = x.value
      const finalY = y.value

      if (isTruthy(snapBack)) {
        if (isTruthy(isReducedMotion.value)) {
          x.value = 0
          y.value = 0
        } else {
          x.value = withTiming(0, { duration: snapBackDuration })
          y.value = withTiming(0, { duration: snapBackDuration })
        }
      }

      onDragEnd?.(finalX, finalY)
    })

  const reset = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      x.value = 0
      y.value = 0
    } else {
      x.value = withSpring(0, springConfigs.smooth)
      y.value = withSpring(0, springConfigs.smooth)
    }
    isDragging.value = false
    offsetXRef.current = 0
    offsetYRef.current = 0
  }, [x, y, isDragging, isReducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Array<{ translateX: number } | { translateY: number }> = []

    if (x.value !== 0) {
      transforms.push({ translateX: x.value })
    }
    if (y.value !== 0) {
      transforms.push({ translateY: y.value })
    }

    return {
      transform: transforms,
    }
  })

  return {
    x,
    y,
    isDragging,
    animatedStyle,
    gesture,
    reset
  }
}

