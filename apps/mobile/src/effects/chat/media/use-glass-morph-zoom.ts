/**
 * Image/Video Open "Glass Morph Zoom" Effect Hook
 *
 * Creates a premium media zoom animation with:
 * - Shared-element zoom with backdrop blur (8-16px)
 * - Subtle bloom
 * - Duration 240-280ms, easing (0.2, 0.8, 0.2, 1)
 * - Haptic Selection on open, none on close
 *
 * Location: apps/mobile/src/effects/chat/media/use-glass-morph-zoom.ts
 */

import { useCallback } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { triggerHaptic } from '../core/haptic-manager'
import { getReducedMotionDuration } from '../core/reduced-motion'
import { randomRange } from '../core/seeded-rng'
import { logEffectEnd, logEffectStart } from '../core/telemetry'
import { getBloomImageFilter } from '../shaders/bloom'
import { getCachedBlurFilter } from '../shaders/blur'
import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Custom easing: (0.2, 0.8, 0.2, 1)
 */
const GLASS_ZOOM_EASING = Easing.bezier(0.2, 0.8, 0.2, 1)

/**
 * Glass morph zoom effect options
 */
export interface UseGlassMorphZoomOptions {
  enabled?: boolean
  blurRadius?: number // 8-16px
  onComplete?: () => void
}

/**
 * Glass morph zoom effect return type
 */
export interface UseGlassMorphZoomReturn {
  scale: SharedValue<number>
  opacity: SharedValue<number>
  blurOpacity: SharedValue<number>
  // ChromaticAberrationFX shared values
  aberrationCenter: SharedValue<{ x: number; y: number }>
  aberrationRadius: SharedValue<number>
  aberrationIntensity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  blurFilter: ReturnType<typeof getCachedBlurFilter>
  bloomConfig: ReturnType<typeof getBloomImageFilter>
  open: () => void
  close: () => void
}

const DEFAULT_ENABLED = true
const ZOOM_DURATION_MIN = 240 // ms
const ZOOM_DURATION_MAX = 280 // ms
const DEFAULT_BLUR_RADIUS = 12 // px

export function useGlassMorphZoom(options: UseGlassMorphZoomOptions = {}): UseGlassMorphZoomReturn {
  const { enabled = DEFAULT_ENABLED, blurRadius = DEFAULT_BLUR_RADIUS, onComplete } = options

  const scale = useSharedValue(1)
  const opacity = useSharedValue(0)
  const blurOpacity = useSharedValue(0)

  // ChromaticAberrationFX shared values
  // Center will be set when image dimensions are known
  const aberrationCenter = useSharedValue({ x: 0, y: 0 })
  const aberrationRadius = useSharedValue(0)
  const aberrationIntensity = useSharedValue(0)

  const open = useCallback(() => {
    if (!enabled) {
      return
    }

    const duration = ZOOM_DURATION_MIN + randomRange(0, ZOOM_DURATION_MAX - ZOOM_DURATION_MIN)
    const finalDuration = getReducedMotionDuration(duration, false)

    // Log effect start
    const effectId = logEffectStart('glass-morph-zoom', {
      blurRadius,
    })

    // Trigger haptic: Selection on open
    triggerHaptic('selection')

    // Zoom animation
    scale.value = withTiming(1.1, {
      duration: finalDuration,
      easing: GLASS_ZOOM_EASING,
    })

    // Fade in
    opacity.value = withTiming(1, {
      duration: finalDuration,
      easing: GLASS_ZOOM_EASING,
    })

    // Blur backdrop fade in
    blurOpacity.value = withTiming(1, {
      duration: finalDuration,
      easing: GLASS_ZOOM_EASING,
    })

    // Chromatic aberration animation (only if not reduced motion)
    aberrationRadius.value = withTiming(6, {
      duration: finalDuration,
      easing: GLASS_ZOOM_EASING,
    })
    aberrationIntensity.value = withTiming(0.7, {
      duration: finalDuration,
      easing: GLASS_ZOOM_EASING,
    })

    // Call onComplete
    if (isTruthy(onComplete)) {
      setTimeout(() => {
        onComplete()
      }, finalDuration)
    }

    // Log effect end
    setTimeout(() => {
      logEffectEnd(effectId, {
        durationMs: finalDuration,
        success: true,
      })
    }, finalDuration)
  }, [
    enabled,
    blurRadius,
    scale,
    opacity,
    blurOpacity,
    aberrationRadius,
    aberrationIntensity,
    onComplete,
  ])

  const close = useCallback(() => {
    if (!enabled) {
      return
    }

    const duration = getReducedMotionDuration(ZOOM_DURATION_MIN, false)

    // No haptic on close

    // Zoom out
    scale.value = withTiming(1, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })

    // Fade out
    opacity.value = withTiming(0, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })

    // Blur backdrop fade out
    blurOpacity.value = withTiming(0, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })

    // Reset chromatic aberration
    aberrationRadius.value = withTiming(0, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })
    aberrationIntensity.value = withTiming(0, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })
  }, [enabled, scale, opacity, blurOpacity, aberrationRadius, aberrationIntensity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  // Get blur and bloom filters
  const blurFilter = getCachedBlurFilter({ radius: blurRadius })
  const bloomConfig = getBloomImageFilter({ intensity: 0.5, radius: blurRadius / 2 })

  return {
    scale,
    opacity,
    blurOpacity,
    aberrationCenter,
    aberrationRadius,
    aberrationIntensity,
    animatedStyle,
    blurFilter,
    bloomConfig,
    open,
    close,
  }
}
