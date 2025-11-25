/**
 * Mobile Adapter: useParallaxScroll
 * Parallax scrolling effects for mobile using ScrollView
 */

import { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from '@petspark/motion'
import { useCallback } from 'react'
import { useAnimatedScrollHandler } from '@petspark/motion'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'

export interface UseParallaxScrollOptions {
  speed?: number
  direction?: 'vertical' | 'horizontal'
  enabled?: boolean
}

export interface UseParallaxScrollReturn {
  scrollY: SharedValue<number>
  scrollX: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>
}

export function useParallaxScroll(options: UseParallaxScrollOptions = {}) {
  const { speed = 0.5, direction = 'vertical', enabled = true } = options

  const isReducedMotion = useReducedMotionSV()
  const scrollY = useSharedValue(0)
  const scrollX = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (!enabled || isReducedMotion.value) return
      scrollY.value = e.contentOffset.y
      scrollX.value = e.contentOffset.x
    },
  })

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || isReducedMotion.value) {
      return {
        transform: []
      }
    }

    if (direction === 'vertical') {
      const translateY = -scrollY.value * speed
      return {
        transform: [{ translateY }],
      }
    } else {
      const translateX = -scrollX.value * speed
      return {
        transform: [{ translateX }],
      }
    }
  })

  return {
    animatedStyle,
    scrollY,
    scrollX,
    scrollHandler,
  }
}

export interface UseParallaxLayersOptions {
  layerCount?: number
  enabled?: boolean
}

export interface UseParallaxLayersReturn {
  scrollY: SharedValue<number>
  createLayerStyle: (layerIndex: number) => ReturnType<typeof useAnimatedStyle>
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>
}

export function useParallaxLayers(layerCount: number = 3, options: UseParallaxLayersOptions = {}) {
  const { enabled = true } = options
  const isReducedMotion = useReducedMotionSV()
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (!enabled || isReducedMotion.value) return
      scrollY.value = e.contentOffset.y
    },
  })

  const createLayerStyle = useCallback(
    (layerIndex: number) => {
      return useAnimatedStyle(() => {
        if (!enabled || isReducedMotion.value) {
          return {
            transform: []
          }
        }

        const depth = (layerIndex + 1) / layerCount
        const speed = depth * 0.5
        const translateY = -scrollY.value * speed
        const scale = interpolate(
          scrollY.value,
          [0, 500],
          [1, 1 + depth * 0.1],
          Extrapolation.CLAMP
        )

        return {
          transform: [{ translateY }, { scale }],
        }
      })
    },
    [layerCount, scrollY, enabled, isReducedMotion]
  )

  return {
    createLayerStyle,
    scrollY,
    scrollHandler,
  }
}

