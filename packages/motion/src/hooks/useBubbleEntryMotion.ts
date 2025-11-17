/**
 * useBubbleEntryMotion - Canonical Bubble Entry Motion Hook (Web)
 * 
 * Provides entry animations for chat bubbles and small cards entering a list.
 * Supports stagger and directional animations.
 * 
 * @packageDocumentation
 */

import { useMemo } from 'react'
import { useReducedMotion } from '@petspark/motion'
import { motionDurations, motionSprings } from '../motionTokens'
import { getFramerSpringTransition, getFramerTimingTransition } from '../framer-api/motionTokens'
import type { HTMLMotionProps, Variants } from '@petspark/motion'

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
   * Motion props ready to spread on MotionView
   */
  motionProps: Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & {
    variants?: Variants
  }
  
  /**
   * Style object (for compatibility, prefer motionProps)
   */
  style: Record<string, unknown>
}

/**
 * Hook for bubble entry animations in chat and lists.
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const bubbleMotion = useBubbleEntryMotion({ index: 0, direction: 'right', isOwn: true })
 * 
 * <MotionView {...bubbleMotion.motionProps}>
 *   <MessageBubble />
 * </MotionView>
 * ```
 */
export function useBubbleEntryMotion(
  options: BubbleMotionOptions = {}
): UseBubbleEntryMotionReturn {
  const reducedMotion = useReducedMotion()
  
  const {
    index = 0,
    direction,
    staggerDelay = 50,
    isOwn = false,
  } = options
  
  // Default direction based on isOwn
  const resolvedDirection = direction ?? (isOwn ? 'right' : 'left')
  
  const transition = useMemo(() => {
    if (reducedMotion) {
      return getFramerTimingTransition('instant', 'standard')
    }
    return getFramerSpringTransition('bubble')
  }, [reducedMotion])
  
  const staggerDelaySeconds = useMemo(() => {
    if (reducedMotion) {
      return 0
    }
    return (index * staggerDelay) / 1000
  }, [reducedMotion, index, staggerDelay])
  
  const variants: Variants = useMemo(() => {
    if (reducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    }
    
    const translateX = resolvedDirection === 'left' ? -20 : 20
    
    return {
      initial: {
        opacity: 0,
        x: translateX,
        scale: 0.9,
      },
      animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          ...transition,
          delay: staggerDelaySeconds,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.9,
        transition: getFramerTimingTransition('fast', 'decel'),
      },
    }
  }, [reducedMotion, resolvedDirection, transition, staggerDelaySeconds])
  
  const motionProps = useMemo<Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & { variants?: Variants }>(() => ({
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants,
    transition,
  }), [variants, transition])
  
  // Style object for compatibility (empty, use motionProps instead)
  const style = useMemo(() => ({}), [])
  
  return {
    motionProps,
    style,
  }
}

