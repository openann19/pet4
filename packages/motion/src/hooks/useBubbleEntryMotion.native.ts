/**
 * useBubbleEntryMotion - Canonical Bubble Entry Motion Hook (Mobile/Native)
 * 
 * Provides entry animations for chat bubbles and small cards entering a list.
 * Supports stagger and directional animations.
 * 
 * @packageDocumentation
 */

import { useCallback, useEffect, useMemo } from 'react'
import {
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  useAnimatedStyle,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
} from 'react-native-reanimated'
import { useReducedMotionSV, getReducedMotionDuration } from '../reduced-motion'
import { motionDurations, motionSprings } from '../motionTokens'
import { isTruthy } from '../utils/guards'

export interface BubbleMotionOptions {
  /**
   * Index for stagger delay (default: 0)
   */
  index?: number
  
  /**
   * Direction from which bubble enters (default: 'right' for own messages, 'left' for incoming)
   */
  direction?: 'left' | 'right'
  
  /**
   * Stagger delay in milliseconds (default: 50ms)
   */
  staggerDelay?: number
  
  /**
   * Whether this is an own message (affects default direction)
   */
  isOwn?: boolean
}

export interface UseBubbleEntryMotionReturn {
  /**
   * Animated style for the component
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  
  /**
   * Entering animation (for use with Animated.View entering prop)
   */
  entering: import('react-native-reanimated').BaseAnimationBuilder | undefined
  
  /**
   * Exiting animation (for use with Animated.View exiting prop)
   */
  exiting: import('react-native-reanimated').BaseAnimationBuilder | undefined
  
  /**
   * Motion props (for compatibility with web API, returns empty object)
   */
  motionProps: Record<string, unknown>
  
  /**
   * Style object (for compatibility)
   */
  style: ReturnType<typeof useAnimatedStyle>
}

/**
 * Hook for bubble entry animations in chat and lists (mobile).
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const bubbleMotion = useBubbleEntryMotion({ index: 0, direction: 'right', isOwn: true })
 * 
 * <Animated.View 
 *   entering={bubbleMotion.entering}
 *   exiting={bubbleMotion.exiting}
 *   style={bubbleMotion.animatedStyle}
 * >
 *   <MessageBubble />
 * </Animated.View>
 * ```
 */
export function useBubbleEntryMotion(
  options: BubbleMotionOptions = {}
): UseBubbleEntryMotionReturn {
  const reducedMotion = useReducedMotionSV()
  
  const {
    index = 0,
    direction,
    staggerDelay = 50,
    isOwn = false,
  } = options
  
  // Default direction based on isOwn
  const resolvedDirection = direction ?? (isOwn ? 'right' : 'left')
  
  const bubbleSpring = motionSprings.bubble
  
  const opacity = useSharedValue(0)
  const translateX = useSharedValue(resolvedDirection === 'left' ? -20 : 20)
  const scale = useSharedValue(0.9)
  
  const staggerDelayMs = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return 0
    }
    return index * staggerDelay
  }, [reducedMotion, index, staggerDelay])
  
  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      opacity.value = 1
      translateX.value = 0
      scale.value = 1
      return
    }
    
    const duration = motionDurations.fast / 1000
    
    opacity.value = withDelay(staggerDelayMs, withTiming(1, { duration }))
    translateX.value = withDelay(staggerDelayMs, withSpring(0, bubbleSpring))
    scale.value = withDelay(staggerDelayMs, withSpring(1, bubbleSpring))
  }, [reducedMotion, opacity, translateX, scale, staggerDelayMs, bubbleSpring])
  
  const animatedStyle = useAnimatedStyle(() => {
    if (isTruthy(reducedMotion.value)) {
      return {
        opacity: opacity.value,
      }
    }
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    }
  })
  
  const entering = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    
    if (resolvedDirection === 'right') {
      return SlideInRight.delay(staggerDelayMs).duration(motionDurations.normal)
    }
    return SlideInLeft.delay(staggerDelayMs).duration(motionDurations.normal)
  }, [reducedMotion, resolvedDirection, staggerDelayMs])
  
  const exiting = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    return FadeOut.duration(motionDurations.fast)
  }, [reducedMotion])
  
  // Motion props for compatibility (empty on mobile)
  const motionProps = useMemo(() => ({}), [])
  
  return {
    animatedStyle,
    entering,
    exiting,
    motionProps,
    style: animatedStyle,
  }
}

