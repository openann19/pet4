/**
 * useOverlayTransition - Canonical Overlay Transition Hook (Mobile/Native)
 *
 * Provides transitions for sheets, dialogs, drawers, and modals.
 * Handles dimmer fade, panel slide/scale, and backdrop interactions.
 *
 * @packageDocumentation
 */

import { useMemo, useEffect } from 'react'
import { useSharedValue, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated'
// Layout animations are imported separately due to TypeScript type issues
// These exist at runtime but TypeScript definitions may be incomplete
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReanimatedLayout = require('react-native-reanimated')
type LayoutAnimationFactory = {
  duration: (ms: number) => unknown
}

const FadeInImpl: LayoutAnimationFactory = ReanimatedLayout.FadeIn
const FadeOutImpl: LayoutAnimationFactory = ReanimatedLayout.FadeOut
const SlideInDownImpl: LayoutAnimationFactory = ReanimatedLayout.SlideInDown
const SlideOutDownImpl: LayoutAnimationFactory = ReanimatedLayout.SlideOutDown
const SlideInUpImpl: LayoutAnimationFactory = ReanimatedLayout.SlideInUp
const SlideOutUpImpl: LayoutAnimationFactory = ReanimatedLayout.SlideOutUp
const SlideInLeftImpl: LayoutAnimationFactory = ReanimatedLayout.SlideInLeft
const SlideOutLeftImpl: LayoutAnimationFactory = ReanimatedLayout.SlideOutLeft
const SlideInRightImpl: LayoutAnimationFactory = ReanimatedLayout.SlideInRight
const SlideOutRightImpl: LayoutAnimationFactory = ReanimatedLayout.SlideOutRight
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
  backdropEntering: unknown | undefined

  /**
   * Exiting animation for backdrop
   */
  backdropExiting: unknown | undefined

  /**
   * Animated style for content panel
   */
  contentStyle: ReturnType<typeof useAnimatedStyle>

  /**
   * Entering animation for content
   */
  contentEntering: unknown | undefined

  /**
   * Exiting animation for content
   */
  contentExiting: unknown | undefined

  /**
   * Backdrop props (for compatibility with web API)
   */
  backdropProps: {
    style: ReturnType<typeof useAnimatedStyle>
    entering?: unknown
    exiting?: unknown
  }

  /**
   * Content props (for compatibility with web API)
   */
  contentProps: {
    style: ReturnType<typeof useAnimatedStyle>
    entering?: unknown
    exiting?: unknown
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

  const { type = 'modal', drawerSide = 'right', isOpen } = options

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
  }, [
    isOpen,
    reducedMotion,
    backdropOpacity,
    contentOpacity,
    contentScale,
    contentTranslateY,
    spring,
  ])

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
      transform: [{ scale: contentScale.value }, { translateY: contentTranslateY.value }],
    }
  })

  const backdropEntering = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    return FadeInImpl.duration(motionDurations.fast)
  }, [reducedMotion])

  const backdropExiting = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }
    return FadeOutImpl.duration(motionDurations.fast)
  }, [reducedMotion])

  const contentEntering = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }

    if (type === 'sheet') {
      return SlideInDownImpl.duration(motionDurations.normal)
    }

    if (type === 'drawer') {
      switch (drawerSide) {
        case 'left':
          return SlideInLeftImpl.duration(motionDurations.normal)
        case 'right':
          return SlideInRightImpl.duration(motionDurations.normal)
        case 'top':
          return SlideInUpImpl.duration(motionDurations.normal)
        case 'bottom':
          return SlideInDownImpl.duration(motionDurations.normal)
      }
    }

    // modal
    return FadeInImpl.duration(motionDurations.normal)
  }, [reducedMotion, type, drawerSide])

  const contentExiting = useMemo(() => {
    if (isTruthy(reducedMotion.value)) {
      return undefined
    }

    if (type === 'sheet') {
      return SlideOutDownImpl.duration(motionDurations.fast)
    }

    if (type === 'drawer') {
      switch (drawerSide) {
        case 'left':
          return SlideOutLeftImpl.duration(motionDurations.fast)
        case 'right':
          return SlideOutRightImpl.duration(motionDurations.fast)
        case 'top':
          return SlideOutUpImpl.duration(motionDurations.fast)
        case 'bottom':
          return SlideOutDownImpl.duration(motionDurations.fast)
      }
    }

    // modal
    return FadeOutImpl.duration(motionDurations.fast)
  }, [reducedMotion, type, drawerSide])

  const backdropProps = useMemo(
    () => ({
      style: backdropStyle,
      ...(backdropEntering && { entering: backdropEntering }),
      ...(backdropExiting && { exiting: backdropExiting }),
    }),
    [backdropStyle, backdropEntering, backdropExiting]
  )

  const contentProps = useMemo(
    () => ({
      style: contentStyle,
      ...(contentEntering && { entering: contentEntering }),
      ...(contentExiting && { exiting: contentExiting }),
    }),
    [contentStyle, contentEntering, contentExiting]
  )

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
