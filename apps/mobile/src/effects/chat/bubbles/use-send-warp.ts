/**
 * Send "Warp" Effect Hook
 * 
 * Creates a premium send animation with:
 * - Cubic bezier slide out (220ms)
 * - Skia glow trail with bloom + chromatic aberration (140ms decay)
 * - Haptic feedback (Selection at send, Light when status flips to "sent")
 * 
 * Location: apps/mobile/src/effects/chat/bubbles/use-send-warp.ts
 */

import { useCallback, useEffect, useRef } from 'react'
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated'
import { createLogger } from '../../../utils/logger'
import { triggerHaptic } from '../core/haptic-manager'
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion'
import { logEffectEnd, logEffectStart } from '../core/telemetry'
import { createAberrationShader } from '../shaders/aberration'
import { createBloomShader, getBloomImageFilter } from '../shaders/bloom'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('send-warp')

/**
 * Cubic bezier easing: (0.17, 0.84, 0.44, 1)
 * Custom easing for send warp slide
 */
const SEND_WARP_EASING = Easing.bezier(0.17, 0.84, 0.44, 1)

/**
 * Send warp effect options
 */
export interface UseSendWarpOptions {
  enabled?: boolean
  onComplete?: () => void
  onStatusChange?: (status: 'sending' | 'sent') => void
}

/**
 * Send warp effect return type
 */
export interface UseSendWarpReturn {
  translateX: SharedValue<number>
  opacity: SharedValue<number>
  glowOpacity: SharedValue<number>
  // AdditiveBloom shared values
  bloomCenterX: SharedValue<number>
  bloomCenterY: SharedValue<number>
  bloomRadius: SharedValue<number>
  bloomIntensity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  trigger: () => void
  triggerStatusChange: (status: 'sent') => void
}

const DEFAULT_ENABLED = true
const SLIDE_DURATION = 220 // ms
const GLOW_DECAY_DURATION = 140 // ms

export function useSendWarp(
  options: UseSendWarpOptions = {}
): UseSendWarpReturn {
  const { enabled = DEFAULT_ENABLED, onComplete, onStatusChange } = options

  const reducedMotion = useReducedMotionSV()
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)
  const glowOpacity = useSharedValue(0)
  
  // AdditiveBloom shared values
  const bloomCenterX = useSharedValue(0)
  const bloomCenterY = useSharedValue(0)
  const bloomRadius = useSharedValue(18)
  const bloomIntensity = useSharedValue(0)

  const effectIdRef = useRef<string | null>(null)
  const hasTriggeredRef = useRef(false)

  const trigger = useCallback(() => {
    if (!enabled || hasTriggeredRef.current) {
      return
    }

    hasTriggeredRef.current = true

    // Check reduced motion
    const isReducedMotion = reducedMotion.value
    const slideDuration = getReducedMotionDuration(SLIDE_DURATION, isReducedMotion)

    // Log effect start
    const effectId = logEffectStart('send-warp', {
      reducedMotion: isReducedMotion,
    })
    effectIdRef.current = effectId

    // Trigger haptic: Selection at send
    triggerHaptic('selection')

    // Slide out animation
    translateX.value = withTiming(
      100, // slide right
      {
        duration: slideDuration,
        easing: isReducedMotion ? Easing.linear : SEND_WARP_EASING,
      }
    )

    // Fade out
    opacity.value = withTiming(
      0,
      {
        duration: slideDuration,
        easing: isReducedMotion ? Easing.linear : SEND_WARP_EASING,
      }
    )

    // Glow trail animation (only if not reduced motion)
    if (!isReducedMotion) {
      glowOpacity.value = withTiming(
        1,
        {
          duration: 50, // quick fade in
          easing: Easing.out(Easing.ease),
        },
        () => {
          // Fade out after peak
          glowOpacity.value = withTiming(
            0,
            {
              duration: GLOW_DECAY_DURATION,
              easing: Easing.in(Easing.ease),
            }
          )
        }
      )
      
      // AdditiveBloom animation - quick pulse then decay
      bloomIntensity.value = withTiming(
        0.9,
        {
          duration: 60,
          easing: Easing.out(Easing.ease),
        },
        () => {
          // Decay
          bloomIntensity.value = withTiming(
            0,
            {
              duration: 160,
              easing: Easing.in(Easing.ease),
            }
          )
        }
      )
    }

    // Call onComplete after animation
    if (isTruthy(onComplete)) {
      setTimeout(() => {
        onComplete()
      }, slideDuration)
    }

    // Log effect end
    setTimeout(() => {
      if (isTruthy(effectIdRef.current)) {
        logEffectEnd(effectIdRef.current, {
          durationMs: slideDuration,
          success: true,
        })
        effectIdRef.current = null
      }
    }, slideDuration)
  }, [enabled, reducedMotion, translateX, opacity, glowOpacity, bloomIntensity, onComplete])

  const triggerStatusChange = useCallback(
    (status: 'sent') => {
      if (status === 'sent') {
        // Trigger haptic: Light when status flips to "sent"
        triggerHaptic('light')
        onStatusChange?.(status)
      }
    },
    [onStatusChange]
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }
  })

  // Create bloom and aberration shaders (for use in Skia components)
  useEffect(() => {
    if (isTruthy(enabled)) {
      const bloomShader = createBloomShader({ intensity: 0.85 })
      const aberrationShader = createAberrationShader({ amount: 1.0, intensity: 0.3 })

      logger.debug('Send warp shaders created', {
        bloom: bloomShader !== null,
        aberration: aberrationShader !== null,
      })
    }
  }, [enabled])

  return {
    translateX,
    opacity,
    glowOpacity,
    bloomCenterX,
    bloomCenterY,
    bloomRadius,
    bloomIntensity,
    animatedStyle,
    trigger,
    triggerStatusChange,
  }
}

/**
 * Get glow trail style for Skia rendering
 */
export function getGlowTrailStyle(glowOpacity: SharedValue<number>): {
  opacity: number
  bloomConfig: ReturnType<typeof getBloomImageFilter>
} {
  return {
    opacity: glowOpacity.value,
    bloomConfig: getBloomImageFilter({ intensity: 0.85, radius: 8 }),
  }
}

