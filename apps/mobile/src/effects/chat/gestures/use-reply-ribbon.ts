/**
 * Reply Ribbon Effect Hook (Mobile)
 *
 * Creates a premium reply/quote ribbon effect with:
 * - Ribbon shader from bubble→composer (180ms)
 * - Follows finger if dragged
 * - Mobile-native: uses React Native gestures and SVG paths
 * - Reduced Motion → line highlight without motion
 *
 * Location: apps/mobile/src/effects/chat/gestures/use-reply-ribbon.ts
 */

import { useCallback, useRef } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { triggerHaptic } from '../core/haptic-manager'
import {
  getReducedMotionDuration,
} from '../core/reduced-motion'
import { logEffectEnd, logEffectStart } from '../core/telemetry'
import { useDeviceRefreshRate } from '../../../hooks/use-device-refresh-rate'
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config'

/**
 * Reply ribbon effect options
 */
export interface UseReplyRibbonOptions {
  readonly enabled?: boolean
  readonly bubbleRect?: { x: number; y: number; width: number; height: number } | null
  readonly composerRect?: { x: number; y: number; width: number; height: number } | null
  readonly onComplete?: () => void
}

/**
 * Reply ribbon effect return type
 */
export interface UseReplyRibbonReturn {
  readonly ribbonP0: SharedValue<{ x: number; y: number }>
  readonly ribbonP1: SharedValue<{ x: number; y: number }>
  readonly ribbonP2: SharedValue<{ x: number; y: number }>
  readonly ribbonThickness: SharedValue<number>
  readonly ribbonOpacity: SharedValue<number>
  readonly ribbonProgress: SharedValue<number>
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>
  readonly start: (startPoint: { x: number; y: number }) => void
  readonly update: (point: { x: number; y: number }) => void
  readonly complete: () => void
  readonly cancel: () => void
}

const DEFAULT_ENABLED = true
const RIBBON_DURATION = 180 // ms
const DEFAULT_THICKNESS = 4 // px
const MAX_THICKNESS = 8 // px

export function useReplyRibbon(
  options: UseReplyRibbonOptions = {}
): UseReplyRibbonReturn {
  const {
    enabled = DEFAULT_ENABLED,
    bubbleRect,
    composerRect,
    onComplete,
  } = options

  const { hz, scaleDuration } = useDeviceRefreshRate()

  // Ribbon control points
  const ribbonP0 = useSharedValue({ x: 0, y: 0 }) // Start point (bubble)
  const ribbonP1 = useSharedValue({ x: 0, y: 0 }) // Middle point (control)
  const ribbonP2 = useSharedValue({ x: 0, y: 0 }) // End point (composer)

  // Ribbon properties
  const ribbonThickness = useSharedValue(DEFAULT_THICKNESS)
  const ribbonOpacity = useSharedValue(0)
  const ribbonProgress = useSharedValue(0)

  const isActiveRef = useRef(false)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)
  const effectIdRef = useRef<string | null>(null)

  const start = useCallback(
    (startPoint: { x: number; y: number }) => {
      if (!enabled || isActiveRef.current) {
        return
      }

      isActiveRef.current = true
      startPointRef.current = startPoint

      // Log effect start
      const effectId = logEffectStart('reply-ribbon', {
        startPoint,
      })
      effectIdRef.current = effectId

      // Set initial point
      if (bubbleRect) {
        ribbonP0.value = {
          x: bubbleRect.x + bubbleRect.width / 2,
          y: bubbleRect.y + bubbleRect.height / 2,
        }
      } else {
        ribbonP0.value = startPoint
      }

      ribbonP1.value = startPoint
      ribbonP2.value = startPoint

      // Fade in ribbon - use adaptive duration
      const baseDuration = getReducedMotionDuration(RIBBON_DURATION, false)
      const duration = scaleDuration(baseDuration)
      ribbonOpacity.value = withTiming(1, {
        duration: duration / 2,
        easing: Easing.out(Easing.ease),
      })

      // Animate thickness - use adaptive spring config
      const springConfig = adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120)
      ribbonThickness.value = withSpring(MAX_THICKNESS, {
        stiffness: springConfig.stiffness,
        damping: springConfig.damping,
        mass: springConfig.mass,
      })

      // Trigger haptic
      triggerHaptic('light')
    },
    [enabled, bubbleRect, hz, scaleDuration, ribbonP0, ribbonP1, ribbonP2, ribbonOpacity, ribbonThickness]
  )

  const update = useCallback(
    (point: { x: number; y: number }) => {
      if (!enabled || !isActiveRef.current) {
        return
      }

      // Update middle point to follow pointer
      ribbonP1.value = point

      // Update end point towards composer
      if (composerRect) {
        const dx = composerRect.x + composerRect.width / 2 - point.x
        const dy = composerRect.y + composerRect.height / 2 - point.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const progress = Math.min(1, distance / 200) // Normalize to 0-1

        ribbonP2.value = {
          x: point.x + dx * progress * 0.5,
          y: point.y + dy * progress * 0.5,
        }

        ribbonProgress.value = progress
      } else {
        ribbonP2.value = point
        ribbonProgress.value = 1
      }
    },
    [enabled, composerRect, ribbonP1, ribbonP2, ribbonProgress]
  )

  const complete = useCallback(() => {
    if (!enabled || !isActiveRef.current) {
      return
    }

    isActiveRef.current = false

    // Use adaptive duration scaling
    const baseDuration = getReducedMotionDuration(RIBBON_DURATION, false)
    const duration = scaleDuration(baseDuration)

    // Animate to composer
    if (composerRect) {
      ribbonP2.value = withTiming(
        {
          x: composerRect.x + composerRect.width / 2,
          y: composerRect.y + composerRect.height / 2,
        },
        {
          duration,
          easing: Easing.inOut(Easing.ease),
        }
      )

      ribbonProgress.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      })
    }

    // Fade out ribbon
    ribbonOpacity.value = withTiming(0, {
      duration: duration / 2,
      easing: Easing.in(Easing.ease),
    })

    // Reset thickness
    ribbonThickness.value = withTiming(DEFAULT_THICKNESS, {
      duration: duration / 2,
      easing: Easing.in(Easing.ease),
    })

    // Call onComplete
    if (onComplete) {
      setTimeout(() => {
        onComplete()
      }, duration)
    }

    // Log effect end
    if (effectIdRef.current) {
      const effectId = effectIdRef.current
      setTimeout(() => {
        logEffectEnd(effectId, {
          durationMs: duration,
          success: true,
        })
        effectIdRef.current = null
      }, duration)
    }

    // Reset after animation
    setTimeout(() => {
      ribbonP0.value = { x: 0, y: 0 }
      ribbonP1.value = { x: 0, y: 0 }
      ribbonP2.value = { x: 0, y: 0 }
      ribbonProgress.value = 0
      startPointRef.current = null
    }, duration)
  }, [
    enabled,
    composerRect,
    scaleDuration,
    ribbonP2,
    ribbonProgress,
    ribbonOpacity,
    ribbonThickness,
    onComplete,
    ribbonP0,
    ribbonP1,
  ])

  const cancel = useCallback(() => {
    if (!enabled || !isActiveRef.current) {
      return
    }

    isActiveRef.current = false

    // Use adaptive duration scaling
    const baseDuration = getReducedMotionDuration(RIBBON_DURATION / 2, false)
    const duration = scaleDuration(baseDuration)

    // Fade out quickly
    ribbonOpacity.value = withTiming(0, {
      duration,
      easing: Easing.in(Easing.ease),
    })

    // Reset thickness
    ribbonThickness.value = withTiming(DEFAULT_THICKNESS, {
      duration,
      easing: Easing.in(Easing.ease),
    })

    // Reset after animation
    setTimeout(() => {
      ribbonP0.value = { x: 0, y: 0 }
      ribbonP1.value = { x: 0, y: 0 }
      ribbonP2.value = { x: 0, y: 0 }
      ribbonProgress.value = 0
      startPointRef.current = null
    }, duration)
  }, [
    enabled,
    scaleDuration,
    ribbonOpacity,
    ribbonThickness,
    ribbonP0,
    ribbonP1,
    ribbonP2,
    ribbonProgress,
  ])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: ribbonOpacity.value,
    }
  })

  return {
    ribbonP0,
    ribbonP1,
    ribbonP2,
    ribbonThickness,
    ribbonOpacity,
    ribbonProgress,
    animatedStyle,
    start,
    update,
    complete,
    cancel,
  }
}
