/**
 * useListItemPresenceMotion - Canonical List Item Presence Motion Hook (Mobile/Native)
 * 
 * Provides mount/unmount presence animations for list items (conversations, notifications, adoption cards).
 * 
 * @packageDocumentation
 */

import { useMemo } from 'react'
import {
  useAnimatedStyle,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '../reduced-motion'
import { motionDurations } from '../motionTokens'
import { isTruthy } from '../utils/guards'

export interface UseListItemPresenceMotionOptions {
  /**
   * Index for stagger delay (default: 0)
   */
  index?: number
  
  /**
   * Stagger delay in milliseconds (default: 30ms)
   */
  staggerDelay?: number
  
  /**
   * Whether to use fade + slide animation (default: true)
   */
  useSlide?: boolean
}

export interface UseListItemPresenceMotionReturn {
  /**
   * Animated style for the component
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  
  /**
   * Entering animation (for use with Animated.View entering prop)
   */
  entering: any | undefined
  
  /**
   * Exiting animation (for use with Animated.View exiting prop)
   */
  exiting: any | undefined
  
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
 * Hook for list item presence animations (mobile).
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const listItemMotion = useListItemPresenceMotion({ index: 0 })
 * 
 * <Animated.View 
 *   entering={listItemMotion.entering}
 *   exiting={listItemMotion.exiting}
 *   style={listItemMotion.animatedStyle}
 * >
 *   <ConversationItem />
 * </Animated.View>
 * ```
 */
export function useListItemPresenceMotion(
  options: UseListItemPresenceMotionOptions = {}
): UseListItemPresenceMotionReturn {
  const reducedMotion = useReducedMotionSV()
  
  const {
    index = 0,
    staggerDelay = 30,
    useSlide = true,
  } = options
  
  const staggerDelayMs = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return 0
    }
    return index * staggerDelay
  }, [reducedMotion, index, staggerDelay])
  
  const animatedStyle = useAnimatedStyle(() => ({}))
  
  const entering = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    
    if (useSlide) {
      return SlideInDown.delay(staggerDelayMs).duration(motionDurations.fast)
    }
    return FadeIn.delay(staggerDelayMs).duration(motionDurations.fast)
  }, [reducedMotion, useSlide, staggerDelayMs])
  
  const exiting = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    
    if (useSlide) {
      return SlideOutUp.duration(motionDurations.fast)
    }
    return FadeOut.duration(motionDurations.fast)
  }, [reducedMotion, useSlide])
  
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

