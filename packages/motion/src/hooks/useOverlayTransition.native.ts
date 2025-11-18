/**
 * useOverlayTransition - Canonical Overlay Transition Hook (Mobile/Native)
 * 
 * Provides transitions for sheets, dialogs, drawers, and modals.
 * Handles dimmer fade, panel slide/scale, and backdrop interactions.
 * 
 * @packageDocumentation
 */

import { useMemo, useEffect } from 'react'
import {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  SlideInUp,
  SlideOutUp,
  SlideInLeft,
  SlideOutLeft,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated'
import { useReducedMotionSV, getReducedMotionDuration } from '../reduced-motion'
import { motionSprings, motionDurations } from '../motionTokens'
import { isTruthy } from '../utils/guards'

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
   * Animated style for backdrop/dimmer
   */
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  
  /**
   * Entering animation for backdrop
   */
  backdropEntering: any | undefined
  
  /**
   * Exiting animation for backdrop
   */
  backdropExiting: any | undefined
  
  /**
   * Animated style for content panel
   */
  contentStyle: ReturnType<typeof useAnimatedStyle>
  
  /**
   * Entering animation for content
   */
  contentEntering: any | undefined
  
  /**
   * Exiting animation for content
   */
  contentExiting: any | undefined
  
  /**
   * Backdrop props (for compatibility with web API)
   */
  backdropProps: {
    style: ReturnType<typeof useAnimatedStyle>
    entering?: any
    exiting?: any
  }
  
  /**
   * Content props (for compatibility with web API)
   */
  contentProps: {
    style: ReturnType<typeof useAnimatedStyle>
    entering?: any
    exiting?: any
  }
}

/**
 * Hook for overlay transitions (sheets, dialogs, modals) (mobile).
 * Respects reduced motion preferences.
 * 
 * @example
 * ```tsx
 * const overlay = useOverlayTransition({ type: 'modal', isOpen: true })
 * 
 * <Animated.View entering={overlay.backdropEntering} exiting={overlay.backdropExiting} style={overlay.backdropStyle}>
 *   <Animated.View entering={overlay.contentEntering} exiting={overlay.contentExiting} style={overlay.contentStyle}>
 *     <DialogContent />
 *   </Animated.View>
 * </Animated.View>
 * ```
 */
export function useOverlayTransition(
  options: UseOverlayTransitionOptions
): UseOverlayTransitionReturn {
  const reducedMotion = useReducedMotionSV()
  
  const {
    type = 'modal',
    drawerSide = 'right',
    isOpen,
  } = options
  
  const springKey = type === 'sheet' ? 'sheet' : 'modal'
  const spring = motionSprings[springKey]
  
  const backdropOpacity = useSharedValue(isOpen ? 1 : 0)
  const contentOpacity = useSharedValue(isOpen ? 1 : 0)
  const contentScale = useSharedValue(isOpen ? 1 : 0.95)
  const contentTranslateY = useSharedValue(isOpen ? 0 : 20)
  
  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      backdropOpacity.value = isOpen ? 1 : 0
      contentOpacity.value = isOpen ? 1 : 0
      contentScale.value = isOpen ? 1 : 0.95
      contentTranslateY.value = isOpen ? 0 : 20
      return
    }
    
    const backdropDuration = motionDurations.fast / 1000
    backdropOpacity.value = withTiming(isOpen ? 1 : 0, { duration: backdropDuration })
    
    if (isOpen) {
      contentOpacity.value = withSpring(1, spring)
      contentScale.value = withSpring(1, spring)
      contentTranslateY.value = withSpring(0, spring)
    } else {
      const contentDuration = motionDurations.fast / 1000
      contentOpacity.value = withTiming(0, { duration: contentDuration })
      contentScale.value = withTiming(0.95, { duration: contentDuration })
      contentTranslateY.value = withTiming(20, { duration: contentDuration })
    }
  }, [isOpen, reducedMotion, backdropOpacity, contentOpacity, contentScale, contentTranslateY, spring])
  
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))
  
  const contentStyle = useAnimatedStyle(() => {
    if (type === 'drawer') {
      return {
        opacity: contentOpacity.value,
      }
    }
    return {
      opacity: contentOpacity.value,
      transform: [
        { scale: contentScale.value },
        { translateY: contentTranslateY.value },
      ],
    }
  })
  
  const backdropEntering = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    return FadeIn.duration(motionDurations.fast)
  }, [reducedMotion])
  
  const backdropExiting = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    return FadeOut.duration(motionDurations.fast)
  }, [reducedMotion])
  
  const contentEntering = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    
    if (type === 'sheet') {
      return SlideInDown.duration(motionDurations.normal)
    }
    
    if (type === 'drawer') {
      switch (drawerSide) {
        case 'left':
          return SlideInLeft.duration(motionDurations.normal)
        case 'right':
          return SlideInRight.duration(motionDurations.normal)
        case 'top':
          return SlideInUp.duration(motionDurations.normal)
        case 'bottom':
          return SlideInDown.duration(motionDurations.normal)
      }
    }
    
    // modal
    return FadeIn.duration(motionDurations.normal)
  }, [reducedMotion, type, drawerSide])
  
  const contentExiting = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    
    if (type === 'sheet') {
      return SlideOutDown.duration(motionDurations.fast)
    }
    
    if (type === 'drawer') {
      switch (drawerSide) {
        case 'left':
          return SlideOutLeft.duration(motionDurations.fast)
        case 'right':
          return SlideOutRight.duration(motionDurations.fast)
        case 'top':
          return SlideOutUp.duration(motionDurations.fast)
        case 'bottom':
          return SlideOutDown.duration(motionDurations.fast)
      }
    }
    
    // modal
    return FadeOut.duration(motionDurations.fast)
  }, [reducedMotion, type, drawerSide])
  
  const backdropProps = useMemo(() => ({
    style: backdropStyle,
    ...(backdropEntering && { entering: backdropEntering }),
    ...(backdropExiting && { exiting: backdropExiting }),
  }), [backdropStyle, backdropEntering, backdropExiting])
  
  const contentProps = useMemo(() => ({
    style: contentStyle,
    ...(contentEntering && { entering: contentEntering }),
    ...(contentExiting && { exiting: contentExiting }),
  }), [contentStyle, contentEntering, contentExiting])
  
  return {
    backdropStyle,
    backdropEntering,
    backdropExiting,
    contentStyle,
    contentEntering,
    contentExiting,
    backdropProps,
    contentProps,
  }
}

