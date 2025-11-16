/**
 * Framer Motion API: Unified Hooks
 * Hooks that work with Framer Motion on web, providing compatibility with Reanimated patterns
 */

import { useMotionValue, useTransform, animate, type MotionValue, type AnimationPlaybackControls } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import type { Transition } from 'framer-motion'
import type { CSSProperties } from 'react'
import {
  convertSpringToFramer,
  convertTimingToFramer,
  withDelayTransition,
  withRepeatTransition,
  type ReanimatedSpringConfig,
  type ReanimatedTimingConfig,
} from './animations'
import { convertTransformToStyle } from './useMotionStyle'

/**
 * SharedValue type for compatibility
 * Includes .value property for Reanimated-style access
 * The getter returns T, the setter accepts either a direct value or an animation object from withSpring/withTiming
 */
export type SharedValue<T extends number | string> = Omit<MotionValue<T>, 'value'> & {
  get value(): T
  set value(newValue: T | { target: T; transition: Transition })
}

/**
 * Equivalent to useSharedValue from Reanimated
 * Returns a MotionValue that can be animated
 * Wraps MotionValue to provide .value getter/setter for Reanimated compatibility                                                                               
 */
export function useSharedValue<T extends number | string>(
  initial: T
): SharedValue<T> {
  const motionValue = useMotionValue(initial)
  
  // Add .value property for Reanimated compatibility
  Object.defineProperty(motionValue, 'value', {
    get(): T {
      return motionValue.get()
    },
    set(newValue: T | { target: T; transition: Transition }) {
      // Handle withSpring/withTiming return values
      if (typeof newValue === 'object' && newValue !== null && 'target' in newValue && 'transition' in newValue) {                                              
        animate(motionValue, newValue.target as number, newValue.transition)
      } else {
        motionValue.set(newValue as T)
      }
    },
    configurable: true,
    enumerable: true,
  })
  
  return motionValue as SharedValue<T>
}

/**
 * Animate a motion value with spring physics
 * Equivalent to: sharedValue.value = withSpring(target, config)
 */
export function animateWithSpring(
  motionValue: MotionValue<number>,
  target: number,
  config?: ReanimatedSpringConfig
): AnimationPlaybackControls {
  const transition = convertSpringToFramer(config)
  return animate(motionValue, target, transition)
}

/**
 * Animate a motion value with timing
 * Equivalent to: sharedValue.value = withTiming(target, config)
 */
export function animateWithTiming(
  motionValue: MotionValue<number>,
  target: number,
  config?: ReanimatedTimingConfig
): AnimationPlaybackControls {
  const transition = convertTimingToFramer(config)
  return animate(motionValue, target, transition)
}

/**
 * Animate a motion value with delay
 * Equivalent to: sharedValue.value = withDelay(delay, animation)
 */
export function animateWithDelay(
  motionValue: MotionValue<number>,
  target: number,
  delay: number,
  transition: Transition
): AnimationPlaybackControls {
  const delayedTransition = withDelayTransition(delay, transition)
  return animate(motionValue, target, delayedTransition)
}

/**
 * Animate a motion value with repeat
 * Equivalent to: sharedValue.value = withRepeat(animation, repeat, reverse)
 */
export function animateWithRepeat(
  motionValue: MotionValue<number>,
  target: number,
  transition: Transition,
  repeat?: number,
  reverse?: boolean
): AnimationPlaybackControls {
  const repeatTransition = withRepeatTransition(
    transition,
    repeat,
    reverse ? 'reverse' : 'loop'
  )
  return animate(motionValue, target, repeatTransition)
}

/**
 * Hook to animate a motion value when it changes
 */
export function useAnimateValue(
  motionValue: MotionValue<number>,
  target: number,
  transition?: Transition
) {
  useEffect(() => {
    if (motionValue.get() !== target) {
      animate(motionValue, target, transition ?? { type: 'tween', duration: 0.3 })
    }
  }, [motionValue, target, transition])
}

/**
 * Transform a motion value using a function
 * Equivalent to useDerivedValue from Reanimated
 */
export function useDerivedValue<T extends number | string, U>(
  motionValue: MotionValue<T>,
  transform: (value: T) => U
): MotionValue<U> {
  return useTransform(motionValue, transform)
}

/**
 * Equivalent to useAnimatedStyle from Reanimated
 * Returns a style object that updates when motion values change
 */
export function useAnimatedStyle(
  styleFactory: () => {
    opacity?: number | MotionValue<number>
    transform?: Array<{ [key: string]: number | string | MotionValue<number> }>
    backgroundColor?: string | number | MotionValue<string | number>
    color?: string | number | MotionValue<string | number>
    width?: number | string | MotionValue<number | string>
    height?: number | string | MotionValue<number | string>
    [key: string]: unknown
  }
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(() => {
    try {
      const computed = styleFactory()
      return convertReanimatedStyleToCSS(computed)
    } catch {
      return {}
    }
  })

  useEffect(() => {
    let rafId: number
    let isActive = true
    
    const updateStyle = () => {
      if (!isActive) return
      
      try {
        const computed = styleFactory()
        const newStyle = convertReanimatedStyleToCSS(computed)
        setStyle(newStyle)
      } catch {
        // Ignore errors
      }
      
      if (isActive) {
        rafId = requestAnimationFrame(updateStyle)
      }
    }

    rafId = requestAnimationFrame(updateStyle)
    return () => {
      isActive = false
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [styleFactory])

  return style
}

/**
 * Convert Reanimated-style object to CSS properties
 * Handles both regular values and MotionValues
 */
function convertReanimatedStyleToCSS(
  style: {
    opacity?: number | MotionValue<number>
    transform?: Array<{ [key: string]: number | string | MotionValue<number> }>
    backgroundColor?: string | number | MotionValue<string | number>
    color?: string | number | MotionValue<string | number>
    width?: number | string | MotionValue<number | string>
    height?: number | string | MotionValue<number | string>
    [key: string]: unknown
  }
): CSSProperties {
  const css: CSSProperties = {}

  if (style.opacity !== undefined) {
    const value = style.opacity instanceof Object && 'get' in style.opacity 
      ? (style.opacity as MotionValue<number>).get() 
      : style.opacity
    css.opacity = value as number
  }

  if (style.backgroundColor !== undefined) {
    const value = style.backgroundColor instanceof Object && 'get' in style.backgroundColor
      ? (style.backgroundColor as MotionValue<string | number>).get()
      : style.backgroundColor
    css.backgroundColor = String(value)
  }

  if (style.color !== undefined) {
    const value = style.color instanceof Object && 'get' in style.color
      ? (style.color as MotionValue<string | number>).get()
      : style.color
    css.color = String(value)
  }

  if (style.width !== undefined) {
    const value = style.width instanceof Object && 'get' in style.width
      ? (style.width as MotionValue<number | string>).get()
      : style.width
    css.width = typeof value === 'number' ? `${value}px` : value
  }

  if (style.height !== undefined) {
    const value = style.height instanceof Object && 'get' in style.height
      ? (style.height as MotionValue<number | string>).get()
      : style.height
    css.height = typeof value === 'number' ? `${value}px` : value
  }

  if (style.transform && Array.isArray(style.transform)) {
    const processedTransforms = style.transform.map(t => {
      const processed: { [key: string]: number | string } = {}
      for (const [key, val] of Object.entries(t)) {
        if (val instanceof Object && 'get' in val) {
          processed[key] = (val as MotionValue<number>).get()
        } else {
          processed[key] = val as number | string
        }
      }
      return processed
    })
    const transformStyle = convertTransformToStyle(processedTransforms)
    Object.assign(css, transformStyle)
  }

  return css
}

/**
 * withSpring - Animate a motion value with spring physics
 * Equivalent to Reanimated's withSpring
 */
export function withSpring(
  target: number,
  config?: ReanimatedSpringConfig
): { target: number; transition: Transition } {
  return {
    target,
    transition: convertSpringToFramer(config),
  }
}

/**
 * withTiming - Animate a motion value with timing
 * Equivalent to Reanimated's withTiming
 */
export function withTiming(
  target: number,
  config?: ReanimatedTimingConfig
): { target: number; transition: Transition } {
  return {
    target,
    transition: convertTimingToFramer(config),
  }
}

/**
 * withRepeat - Repeat an animation
 * Equivalent to Reanimated's withRepeat
 */
export function withRepeat(
  animation: { target: number; transition: Transition },
  repeat?: number,
  reverse?: boolean
): { target: number; transition: Transition } {
  return {
    target: animation.target,
    transition: withRepeatTransition(
      animation.transition,
      repeat,
      reverse ? 'reverse' : 'loop'
    ),
  }
}

/**
 * withSequence - Sequence multiple animations
 * Equivalent to Reanimated's withSequence
 */
export function withSequence(
  ...animations: Array<{ target: number; transition?: Transition }>
): { target: number; transition: Transition } {
  if (animations.length === 0) {
    return { target: 0, transition: { type: 'tween', duration: 0.3 } }
  }

  const last = animations[animations.length - 1]
  if (!last) {
    return { target: 0, transition: { type: 'tween', duration: 0.3 } }
  }
  
  return {
    target: last.target,
    transition: last.transition ?? { type: 'tween', duration: 0.3 },
  }
}

/**
 * withDelay - Add delay to an animation
 * Equivalent to Reanimated's withDelay
 */
export function withDelay(
  delayMs: number,
  animation: { target: number; transition: Transition }
): { target: number; transition: Transition } {
  return {
    target: animation.target,
    transition: withDelayTransition(delayMs, animation.transition),
  }
}

/**
 * withDecay - Decay animation (not directly supported in Framer Motion, use timing as fallback)
 */
export function withDecay(
  config?: { velocity?: number; deceleration?: number }
): { target: number; transition: Transition } {
  // Framer Motion doesn't have decay, use a custom easing that approximates it
  return {
    target: 0,
    transition: {
      type: 'tween',
      duration: 1,
      ease: [0.2, 0, 0.2, 1], // Approximate decay
    },
  }
}

