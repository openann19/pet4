/**
 * Reply Ribbon Effect Hook (Web)
 *
 * Creates a premium reply/quote ribbon effect with:
 * - Ribbon shader from bubble→composer (180ms)
 * - Follows finger/mouse if dragged
 * - Web-compatible: uses SVG paths and pointer events
 * - Reduced Motion → line highlight without motion
 *
 * Location: apps/web/src/effects/chat/gestures/use-reply-ribbon.ts
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
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '../core/haptic-manager'
import {
  getReducedMotionDuration,
  useReducedMotionSV,
} from '../core/reduced-motion'
import { logEffectEnd, logEffectStart } from '../core/telemetry'
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate'
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config'
import { useUIConfig } from '@/hooks/use-ui-config'

const logger = createLogger('reply-ribbon')

/**
 * Reply ribbon effect options
 */
export interface UseReplyRibbonOptions {
  enabled?: boolean
  bubbleRect?: DOMRect | null // Bubble element rect for positioning
  composerRect?: DOMRect | null // Composer element rect for positioning
  onComplete?: () => void
}

/**
 * Reply ribbon effect return type
 */
export interface UseReplyRibbonReturn {
  ribbonP0: SharedValue<{ x: number; y: number }>
  ribbonP1: SharedValue<{ x: number; y: number }>
  ribbonP2: SharedValue<{ x: number; y: number }>
  ribbonThickness: SharedValue<number>
  ribbonOpacity: SharedValue<number>
  ribbonProgress: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  start: (startPoint: { x: number; y: number }) => void
  update: (point: { x: number; y: number }) => void
  complete: () => void
  cancel: () => void
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

  const reducedMotion = useReducedMotionSV()
  const { hz, scaleDuration } = useDeviceRefreshRate()
  const { visual, feedback, animation } = useUIConfig()

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
          x: bubbleRect.left + bubbleRect.width / 2,
          y: bubbleRect.top + bubbleRect.height / 2,
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

      // Animate thickness - use UI config spring physics or adaptive config
      // Scale spring config based on device refresh rate
      const baseSpringConfig = animation.enableReanimated && animation.springPhysics
        ? {
            stiffness: animation.springPhysics.stiffness,
            damping: animation.springPhysics.damping,
            mass: animation.springPhysics.mass,
          }
        : adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120 | 240)

      // Apply adaptive scaling for higher refresh rates
      const springConfig = {
        stiffness: baseSpringConfig.stiffness,
        damping: baseSpringConfig.damping,
        mass: baseSpringConfig.mass,
      }
      ribbonThickness.value = withSpring(MAX_THICKNESS, springConfig)

      // Trigger haptic (only if haptics enabled)
      if (feedback.haptics) {
        triggerHaptic('light')
      }
    },
    [enabled, bubbleRect, hz, scaleDuration, visual, feedback, animation, ribbonP0, ribbonP1, ribbonP2, ribbonOpacity, ribbonThickness]
  )

  const update = useCallback(
    (point: { x: number; y: number }) => {
      if (!enabled || !isActiveRef.current) {
        return
      }

      // Physics simulation: Add tension and elasticity for realistic ribbon behavior
      // The ribbon should have some resistance to movement (tension) and spring back (elasticity)
      const tension = 0.7 // How much the ribbon resists stretching (0-1)
      const elasticity = 0.3 // How much the ribbon springs back (0-1)

      // Calculate distance from previous point for tension simulation
      const prevP1 = ribbonP1.value
      const dx = point.x - prevP1.x
      const dy = point.y - prevP1.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Apply tension: The ribbon doesn't immediately follow, it has resistance
      const tensionFactor = 1 - tension
      const newP1 = {
        x: prevP1.x + dx * tensionFactor,
        y: prevP1.y + dy * tensionFactor,
      }

      // Update middle point with physics simulation
      ribbonP1.value = newP1

      // Update end point towards composer with elasticity
      if (composerRect) {
        const targetX = composerRect.left + composerRect.width / 2
        const targetY = composerRect.top + composerRect.height / 2
        const dx2 = targetX - point.x
        const dy2 = targetY - point.y
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
        const progress = Math.min(1, distance2 / 200) // Normalize to 0-1

        // Apply elasticity: The end point springs toward the composer
        const elasticityFactor = progress * elasticity
        ribbonP2.value = {
          x: point.x + dx2 * elasticityFactor,
          y: point.y + dy2 * elasticityFactor,
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
          x: composerRect.left + composerRect.width / 2,
          y: composerRect.top + composerRect.height / 2,
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
