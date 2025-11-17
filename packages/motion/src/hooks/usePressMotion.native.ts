/**
 * usePressMotion - Canonical Press Motion Hook (Mobile/Native)
 * 
 * Provides press animations for buttons, icon buttons, FABs, and small pills.
 * Uses motion tokens for consistent feel across the app.
 * 
 * @packageDocumentation
 */

import { useCallback, useMemo } from 'react'
import { useSharedValue, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated'
import { useReducedMotionSV, getReducedMotionDuration } from '../reduced-motion'
import { motionSprings, motionDurations } from '../motionTokens'
import { isTruthy } from '../utils/guards'

export interface UsePressMotionOptions {
  /**
   * Scale value when pressed (default: 0.95)
   */
  scaleOnPress?: number
  
  /**
   * Scale value when hovered (default: 1.02) - not used on mobile
   */
  scaleOnHover?: number
  
  /**
   * Opacity when pressed (default: 0.9)
   */
  opacityOnPress?: number
  
  /**
   * Whether to enable hover effects (default: false on mobile)
   */
  enableHover?: boolean
}

export interface UsePressMotionReturn {
  /**
   * Press handlers for mobile
   */
  onPressIn: () => void
  onPressOut: () => void
  
  /**
   * Animated style for the component
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  
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
 * Hook for press motion on buttons and interactive elements (mobile).
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const pressMotion = usePressMotion()
 * 
 * <Animated.View style={pressMotion.animatedStyle}>
 *   <Pressable onPressIn={pressMotion.onPressIn} onPressOut={pressMotion.onPressOut}>
 *     <Button>Click me</Button>
 *   </Pressable>
 * </Animated.View>
 * ```
 */
export function usePressMotion(options: UsePressMotionOptions = {}): UsePressMotionReturn {
  const reducedMotion = useReducedMotionSV()
  
  const {
    scaleOnPress = 0.95,
    opacityOnPress = 0.9,
  } = options
  
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  
  const pressSpring = motionSprings.press
  
  const onPressIn = useCallback(() => {
    if (isTruthy(reducedMotion.value)) {
      const duration = getReducedMotionDuration(motionDurations.instant, true)
      scale.value = withTiming(scaleOnPress, { duration })
      opacity.value = withTiming(opacityOnPress, { duration })
    } else {
      scale.value = withSpring(scaleOnPress, pressSpring)
      opacity.value = withTiming(opacityOnPress, { duration: motionDurations.fast / 1000 })
    }
  }, [reducedMotion, scale, opacity, scaleOnPress, opacityOnPress, pressSpring])
  
  const onPressOut = useCallback(() => {
    if (isTruthy(reducedMotion.value)) {
      const duration = getReducedMotionDuration(motionDurations.instant, true)
      scale.value = withTiming(1, { duration })
      opacity.value = withTiming(1, { duration })
    } else {
      scale.value = withSpring(1, pressSpring)
      opacity.value = withTiming(1, { duration: motionDurations.fast / 1000 })
    }
  }, [reducedMotion, scale, opacity, pressSpring])
  
  const animatedStyle = useAnimatedStyle(() => {
    if (isTruthy(reducedMotion.value)) {
      return {
        opacity: opacity.value,
      }
    }
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })
  
  // Motion props for compatibility (empty on mobile)
  const motionProps = useMemo(() => ({}), [])
  
  return {
    onPressIn,
    onPressOut,
    animatedStyle,
    motionProps,
    style: animatedStyle,
  }
}

