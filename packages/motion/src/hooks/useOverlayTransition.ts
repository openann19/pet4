/**
 * useOverlayTransition - Canonical Overlay Transition Hook (Web)
 * 
 * Provides transitions for sheets, dialogs, drawers, and modals.
 * Handles dimmer fade, panel slide/scale, and backdrop interactions.
 * 
 * @packageDocumentation
 */

import { useMemo } from 'react'
import { useReducedMotion } from '@petspark/motion'
import { motionSprings } from '../motionTokens'
import { getFramerSpringTransition, getFramerTimingTransition } from '../framer-api/motionTokens'
import type { HTMLMotionProps, Variants } from '@petspark/motion'

export interface UseOverlayTransitionOptions {
  /**
   * Type of overlay: 'sheet' | 'modal' | 'drawer' (default: 'modal')
   */
  type?: 'sheet' | 'modal' | 'drawer'
  
  /**
   * Side for drawer (default: 'right')
   */
  drawerSide?: 'left' | 'right' | 'top' | 'bottom'
  
  /**
   * Whether overlay is open
   */
  isOpen: boolean
}

export interface UseOverlayTransitionReturn {
  /**
   * Motion props for backdrop/dimmer
   */
  backdropProps: Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & {
    variants?: Variants
  }
  
  /**
   * Motion props for content panel
   */
  contentProps: Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & {
    variants?: Variants
  }
}

/**
 * Hook for overlay transitions (sheets, dialogs, modals).
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const overlay = useOverlayTransition({ type: 'modal', isOpen: true })
 * 
 * <MotionView {...overlay.backdropProps}>
 *   <MotionView {...overlay.contentProps}>
 *     <DialogContent />
 *   </MotionView>
 * </MotionView>
 * ```
 */
export function useOverlayTransition(
  options: UseOverlayTransitionOptions
): UseOverlayTransitionReturn {
  const reducedMotion = useReducedMotion()
  
  const {
    type = 'modal',
    drawerSide = 'right',
    isOpen,
  } = options
  
  const springKey = type === 'sheet' ? 'sheet' : 'modal'
  
  const backdropTransition = useMemo(() => {
    if (reducedMotion) {
      return getFramerTimingTransition('instant', 'standard')
    }
    return getFramerTimingTransition('fast', 'decel')
  }, [reducedMotion])
  
  const contentTransition = useMemo(() => {
    if (reducedMotion) {
      return getFramerTimingTransition('instant', 'standard')
    }
    return getFramerSpringTransition(springKey)
  }, [reducedMotion, springKey])
  
  const backdropVariants: Variants = useMemo(() => {
    if (reducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: isOpen ? 1 : 0 },
        exit: { opacity: 0 },
      }
    }
    
    return {
      initial: { opacity: 0 },
      animate: { opacity: isOpen ? 1 : 0 },
      exit: { opacity: 0 },
    }
  }, [reducedMotion, isOpen])
  
  const contentVariants: Variants = useMemo(() => {
    if (reducedMotion) {
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.95 },
        exit: { opacity: 0, scale: 0.95 },
      }
    }
    
    if (type === 'drawer') {
      const translateKey = drawerSide === 'left' || drawerSide === 'right' ? 'x' : 'y'
      const translateValue = drawerSide === 'left' || drawerSide === 'top' ? -100 : 100
      
      return {
        initial: { [translateKey]: translateValue, opacity: 0 },
        animate: { [translateKey]: isOpen ? 0 : translateValue, opacity: isOpen ? 1 : 0 },
        exit: { [translateKey]: translateValue, opacity: 0 },
      }
    }
    
    if (type === 'sheet') {
      return {
        initial: { y: '100%', opacity: 0 },
        animate: { y: isOpen ? 0 : '100%', opacity: isOpen ? 1 : 0 },
        exit: { y: '100%', opacity: 0 },
      }
    }
    
    // modal
    return {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { 
        opacity: isOpen ? 1 : 0, 
        scale: isOpen ? 1 : 0.95,
        y: isOpen ? 0 : 20,
      },
      exit: { opacity: 0, scale: 0.95, y: 20 },
    }
  }, [reducedMotion, type, drawerSide, isOpen])
  
  const backdropProps = useMemo<Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & { variants?: Variants }>(() => ({
    initial: 'initial',
    animate: isOpen ? 'animate' : 'exit',
    exit: 'exit',
    variants: backdropVariants,
    transition: backdropTransition,
  }), [backdropVariants, backdropTransition, isOpen])
  
  const contentProps = useMemo<Partial<Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>> & { variants?: Variants }>(() => ({
    initial: 'initial',
    animate: isOpen ? 'animate' : 'exit',
    exit: 'exit',
    variants: contentVariants,
    transition: contentTransition,
  }), [contentVariants, contentTransition, isOpen])
  
  return {
    backdropProps,
    contentProps,
  }
}

