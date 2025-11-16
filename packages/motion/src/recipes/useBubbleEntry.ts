/**
 * useBubbleEntry
 * Shared animation hook for staggered message/bubble entry animations
 * 
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Chat Effects
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSharedValue, useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { createSpringAnimation, createTimingAnimation, createDelayedAnimation, stopAnimation } from '../core/animations'
import { useReducedMotion } from '../core/hooks'
import type { BaseAnimationConfig } from '../core/types'
import { isTruthy, isDefined } from '../utils/guards';

export interface UseBubbleEntryOptions extends BaseAnimationConfig {
  /**
   * Direction from which the bubble enters
   * @default 'bottom'
   */
  direction?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * Distance the bubble travels during entry (pixels)
   * @default 30
   */
  distance?: number

  /**
   * Initial scale of the bubble (0-1)
   * @default 0.8
   */
  initialScale?: number

  /**
   * Final scale of the bubble (usually 1)
   * @default 1
   */
  finalScale?: number

  /**
   * Initial opacity (0-1)
   * @default 0
   */
  initialOpacity?: number

  /**
   * Final opacity (0-1)
   * @default 1
   */
  finalOpacity?: number

  /**
   * Entry animation duration (ms)
   * @default 400
   */
  entryDuration?: number

  /**
   * Stagger delay when multiple bubbles enter (ms)
   * @default 50
   */
  staggerDelay?: number

  /**
   * Index for staggered animations (0-based)
   * @default 0
   */
  index?: number

  /**
   * Whether to enable bounce effect on entry
   * @default true
   */
  enableBounce?: boolean

  /**
   * Auto-trigger entry on mount
   * @default true
   */
  autoTrigger?: boolean

  /**
   * Spring configuration for entry animation
   */
  springConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
}

export interface UseBubbleEntryReturn {
  /**
   * Animated style object for the bubble
   */
  style: ReturnType<typeof useAnimatedStyle>

  /**
   * Trigger the entry animation
   */
  enter: () => void

  /**
   * Trigger the exit animation
   */
  exit: () => void

  /**
   * Reset to initial state
   */
  reset: () => void

  /**
   * Whether the bubble is currently visible
   */
  isVisible: boolean

  /**
   * Whether animation is currently running
   */
  isAnimating: boolean
}

interface ResolvedBubbleEntryConfig {
  readonly direction: 'top' | 'bottom' | 'left' | 'right'
  readonly distance: number
  readonly initialScale: number
  readonly finalScale: number
  readonly initialOpacity: number
  readonly finalOpacity: number
  readonly entryDuration: number
  readonly staggerDelay: number
  readonly index: number
  readonly enableBounce: boolean
  readonly autoTrigger: boolean
  readonly springConfig: {
    readonly damping: number
    readonly stiffness: number
    readonly mass: number
  }
}

const defaultConfig = {
  direction: 'bottom' as const,
  distance: 30,
  initialScale: 0.8,
  finalScale: 1,
  initialOpacity: 0,
  finalOpacity: 1,
  entryDuration: 400,
  staggerDelay: 50,
  index: 0,
  enableBounce: true,
  autoTrigger: true,
  springConfig: {
    damping: 15,
    stiffness: 200,
    mass: 1
  }
} as const

export function useBubbleEntry(
  options: UseBubbleEntryOptions = {}
): UseBubbleEntryReturn {
  const config = useMemo<ResolvedBubbleEntryConfig>(() => {
    const springOverrides = options.springConfig ?? {}

    return {
      direction: options.direction ?? defaultConfig.direction,
      distance: options.distance ?? defaultConfig.distance,
      initialScale: options.initialScale ?? defaultConfig.initialScale,
      finalScale: options.finalScale ?? defaultConfig.finalScale,
      initialOpacity: options.initialOpacity ?? defaultConfig.initialOpacity,
      finalOpacity: options.finalOpacity ?? defaultConfig.finalOpacity,
      entryDuration: options.entryDuration ?? defaultConfig.entryDuration,
      staggerDelay: options.staggerDelay ?? defaultConfig.staggerDelay,
      index: options.index ?? defaultConfig.index,
      enableBounce: options.enableBounce ?? defaultConfig.enableBounce,
      autoTrigger: options.autoTrigger ?? defaultConfig.autoTrigger,
      springConfig: {
        damping: springOverrides.damping ?? defaultConfig.springConfig.damping,
        stiffness: springOverrides.stiffness ?? defaultConfig.springConfig.stiffness,
        mass: springOverrides.mass ?? defaultConfig.springConfig.mass,
      }
    }
  }, [
    options.autoTrigger,
    options.direction,
    options.distance,
    options.enableBounce,
    options.entryDuration,
    options.finalOpacity,
    options.finalScale,
    options.index,
    options.initialOpacity,
    options.initialScale,
  options.springConfig,
    options.staggerDelay,
  ])
  const isReducedMotion = useReducedMotion()

  // Animation values
  const translateX: SharedValue<number> = useSharedValue<number>(0)
  const translateY: SharedValue<number> = useSharedValue<number>(0)
  const scale: SharedValue<number> = useSharedValue<number>(config.initialScale)
  const opacity: SharedValue<number> = useSharedValue<number>(config.initialOpacity)

  // State tracking
  const isVisible: SharedValue<boolean> = useSharedValue<boolean>(false)
  const isAnimating: SharedValue<boolean> = useSharedValue<boolean>(false)

  // Calculate initial position based on direction
  const getInitialTransform = useCallback(() => {
    switch (config.direction) {
      case 'top':
        return { x: 0, y: -config.distance }
      case 'bottom':
        return { x: 0, y: config.distance }
      case 'left':
        return { x: -config.distance, y: 0 }
      case 'right':
        return { x: config.distance, y: 0 }
      default:
        return { x: 0, y: config.distance }
    }
  }, [config.direction, config.distance])

  const reset = useCallback(() => {
    const initial = getInitialTransform()
    translateX.value = initial.x
    translateY.value = initial.y
    scale.value = config.initialScale
    opacity.value = config.initialOpacity
    isVisible.value = false
    isAnimating.value = false

    // Stop any running animations
    stopAnimation(translateX)
    stopAnimation(translateY)
    stopAnimation(scale)
    stopAnimation(opacity)
  }, [
    config.initialOpacity,
    config.initialScale,
    getInitialTransform,
    isAnimating,
    isVisible,
    opacity,
    scale,
    translateX,
    translateY,
  ])

  const enter = useCallback(() => {
    if (isVisible.value || isAnimating.value) return

    isAnimating.value = true
    isVisible.value = true

    // Calculate stagger delay
    const staggeredDelay = config.index * config.staggerDelay

    if (isTruthy(isReducedMotion.value)) {
      // Instant animations for reduced motion
      setTimeout(() => {
        translateX.value = 0
        translateY.value = 0
        scale.value = config.finalScale
        opacity.value = config.finalOpacity
        isAnimating.value = false
      }, staggeredDelay)
    } else {
      // Full spring animations
      const springConfigWithDelay = {
        ...config.springConfig,
        reducedMotion: false
      }

      // Position animation
      translateX.value = createDelayedAnimation(0, staggeredDelay, {
        type: 'spring',
        springConfig: springConfigWithDelay
      })

      translateY.value = createDelayedAnimation(0, staggeredDelay, {
        type: 'spring',
        springConfig: springConfigWithDelay
      })

      // Scale animation with bounce
      if (isTruthy(config.enableBounce)) {
        scale.value = createDelayedAnimation(
          config.finalScale * 1.1, // Overshoot
          staggeredDelay,
          {
            type: 'spring',
            springConfig: {
              ...springConfigWithDelay,
              stiffness: config.springConfig.stiffness
            }
          }
        )

        // Settle back to final scale
        setTimeout(() => {
          if (isTruthy(isVisible.value)) {
            scale.value = createSpringAnimation(config.finalScale, springConfigWithDelay)
          }
        }, staggeredDelay + (config.entryDuration * 0.6))
      } else {
        scale.value = createDelayedAnimation(
          config.finalScale,
          staggeredDelay,
          {
            type: 'spring',
            springConfig: springConfigWithDelay
          }
        )
      }

      // Opacity animation (faster)
      opacity.value = createDelayedAnimation(
        config.finalOpacity,
        staggeredDelay,
        {
          type: 'timing',
          duration: config.entryDuration * 0.5,
          reducedMotion: false,
          timingConfig: {}
        }
      )

      // Mark animation as complete
      setTimeout(() => {
        isAnimating.value = false
      }, staggeredDelay + config.entryDuration)
    }
  }, [
    config.enableBounce,
    config.entryDuration,
    config.finalOpacity,
    config.finalScale,
    config.index,
    config.springConfig,
    config.staggerDelay,
    isAnimating,
    isReducedMotion,
    isVisible,
    opacity,
    scale,
    translateX,
    translateY,
  ])

  const exit = useCallback(() => {
    if (!isVisible.value || isAnimating.value) return

    isAnimating.value = true

    if (isTruthy(isReducedMotion.value)) {
      // Instant exit for reduced motion
      opacity.value = 0
      isVisible.value = false
      isAnimating.value = false
    } else {
      // Animated exit
      const exitTimingConfig = {
        duration: config.entryDuration * 0.5,
        reducedMotion: false
      }

      opacity.value = createTimingAnimation(0, exitTimingConfig)
      scale.value = createSpringAnimation(config.initialScale, {
        ...config.springConfig,
        reducedMotion: false
      })

      setTimeout(() => {
        isVisible.value = false
        isAnimating.value = false
      }, config.entryDuration * 0.5)
    }
  }, [
    config.entryDuration,
    config.initialScale,
    config.springConfig,
    isAnimating,
    isReducedMotion,
    isVisible,
    opacity,
    scale,
  ])

  // Create animated style
  const style = useAnimatedStyle(() => {
    const transforms: Array<{ [key: string]: number | string }> = []
    if (translateX.value !== 0) transforms.push({ translateX: translateX.value })                                                                               
    if (translateY.value !== 0) transforms.push({ translateY: translateY.value })                                                                               
    if (scale.value !== 1) transforms.push({ scale: scale.value })
    
    return {
      transform: transforms,
      opacity: opacity.value,
    }
  })

  // Initialize and auto-trigger
  useEffect(() => {
    reset()
    
    if (isTruthy(config.autoTrigger)) {
      // Small delay to ensure component is mounted
      const timeout = setTimeout(() => {
        enter()
      }, 16) // One frame delay

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [reset, enter, config.autoTrigger])

  return {
    style,
    enter,
    exit,
    reset,
    isVisible: isVisible.value,
    isAnimating: isAnimating.value,
  }
}