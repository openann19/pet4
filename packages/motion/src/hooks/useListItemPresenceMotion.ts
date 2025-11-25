/**
 * useListItemPresenceMotion - Canonical List Item Presence Motion Hook (Web)
 *
 * Provides mount/unmount presence animations for list items (conversations, notifications, adoption cards).
 *
 * @packageDocumentation
 */

import { useMemo } from 'react'
import { useReducedMotion } from '@petspark/motion'
import { getFramerTimingTransition } from '../framer-api/motionTokens'
import type { HTMLMotionProps, Variants } from '@petspark/motion'

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
   * Motion props ready to spread on MotionView
   */
  motionProps: Partial<
    Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>
  > & {
    variants?: Variants
  }

  /**
   * Style object (for compatibility, prefer motionProps)
   */
  style: Record<string, unknown>
}

/**
 * Hook for list item presence animations.
 * Respects reduced motion preferences.
 *
 * @example
 * ```tsx
 * const listItemMotion = useListItemPresenceMotion({ index: 0 })
 *
 * <MotionView {...listItemMotion.motionProps}>
 *   <ConversationItem />
 * </MotionView>
 * ```
 */
export function useListItemPresenceMotion(
  options: UseListItemPresenceMotionOptions = {}
): UseListItemPresenceMotionReturn {
  const reducedMotion = useReducedMotion()

  const { index = 0, staggerDelay = 30, useSlide = true } = options

  const transition = useMemo(() => {
    if (reducedMotion) {
      return getFramerTimingTransition('instant', 'standard')
    }
    return getFramerTimingTransition('fast', 'decel')
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

    if (useSlide) {
      return {
        initial: {
          opacity: 0,
          y: 10,
        },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            ...transition,
            delay: staggerDelaySeconds,
          },
        },
        exit: {
          opacity: 0,
          y: -10,
          transition: {
            ...transition,
          },
        },
      }
    }

    return {
      initial: {
        opacity: 0,
      },
      animate: {
        opacity: 1,
        transition: {
          ...transition,
          delay: staggerDelaySeconds,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          ...transition,
        },
      },
    }
  }, [reducedMotion, useSlide, transition, staggerDelaySeconds])

  const motionProps = useMemo<
    Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & {
      variants?: Variants
    }
  >(
    () => ({
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
      variants,
      transition,
    }),
    [variants, transition]
  )

  // Style object for compatibility (empty, use motionProps instead)
  const style = useMemo(() => ({}), [])

  return {
    motionProps,
    style,
  }
}
