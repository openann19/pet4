/**
 * usePressMotion - Canonical Press Motion Hook (Web)
 * 
 * Provides press and hover animations for buttons, icon buttons, FABs, and small pills.
 * Uses motion tokens for consistent feel across the app.
 * 
 * @packageDocumentation
 */

import { useCallback, useMemo } from 'react'
import { useMotionValue, animate, type MotionValue } from '@petspark/motion'
import { useReducedMotion } from '@petspark/motion'
import { motionSprings, motionDurations } from '../motionTokens'
import { getFramerSpringTransition, getFramerTimingTransition } from '../framer-api/motionTokens'
import type { HTMLMotionProps } from '@petspark/motion'

export interface UsePressMotionOptions {
  /**
   * Scale value when pressed (default: 0.95)
   */
  scaleOnPress?: number
  
  /**
   * Scale value when hovered (default: 1.02)
   */
  scaleOnHover?: number
  
  /**
   * Opacity when pressed (default: 0.9)
   */
  opacityOnPress?: number
  
  /**
   * Whether to enable hover effects (default: true on web)
   */
  enableHover?: boolean
}

export interface UsePressMotionReturn {
  /**
   * Motion props ready to spread on MotionView
   */
  motionProps: Partial<Pick<HTMLMotionProps<'div'>, 'whileHover' | 'whileTap' | 'transition'>>
  
  /**
   * Style object (for compatibility, prefer motionProps)
   */
  style: Record<string, unknown>
}

/**
 * Hook for press and hover motion on buttons and interactive elements.
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const pressMotion = usePressMotion()
 * 
 * <MotionView {...pressMotion.motionProps}>
 *   <Button>Click me</Button>
 * </MotionView>
 * ```
 */
export function usePressMotion(options: UsePressMotionOptions = {}): UsePressMotionReturn {
  const reducedMotion = useReducedMotion()
  
  const {
    scaleOnPress = 0.95,
    scaleOnHover = 1.02,
    opacityOnPress = 0.9,
    enableHover = true,
  } = options
  
  const pressTransition = useMemo(() => {
    if (reducedMotion) {
      return getFramerTimingTransition('instant', 'standard')
    }
    return getFramerSpringTransition('press')
  }, [reducedMotion])
  
  const hoverTransition = useMemo(() => {
    if (reducedMotion) {
      return getFramerTimingTransition('instant', 'standard')
    }
    return getFramerSpringTransition('press')
  }, [reducedMotion])
  
  const whileHover = useMemo(() => {
    if (reducedMotion || !enableHover) {
      return undefined
    }
    return {
      scale: scaleOnHover,
      transition: hoverTransition,
    }
  }, [reducedMotion, enableHover, scaleOnHover, hoverTransition])
  
  const whileTap = useMemo(() => {
    if (reducedMotion) {
      // Minimal opacity change for reduced motion
      return {
        opacity: 0.8,
        transition: pressTransition,
      }
    }
    return {
      scale: scaleOnPress,
      opacity: opacityOnPress,
      transition: pressTransition,
    }
  }, [reducedMotion, scaleOnPress, opacityOnPress, pressTransition])
  
  const motionProps = useMemo<Partial<Pick<HTMLMotionProps<'div'>, 'whileHover' | 'whileTap' | 'transition'>>>(() => ({
    ...(whileHover && { whileHover }),
    ...(whileTap && { whileTap }),
    transition: pressTransition,
  }), [whileHover, whileTap, pressTransition])
  
  // Style object for compatibility (empty, use motionProps instead)
  const style = useMemo(() => ({}), [])
  
  return {
    motionProps,
    style,
  }
}

