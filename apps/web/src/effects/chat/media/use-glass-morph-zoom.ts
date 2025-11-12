/**
 * Image/Video Open "Glass Morph Zoom" Effect Hook (Web)
 *
 * Creates a premium media zoom animation with:
 * - Shared-element zoom with backdrop blur (8-16px)
 * - Subtle bloom
 * - Duration 240-280ms, easing (0.2, 0.8, 0.2, 1)
 * - Web-compatible: uses CSS filters instead of Skia
 *
 * Location: apps/web/src/effects/chat/media/use-glass-morph-zoom.ts
 */

import { useCallback } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate'
import { triggerHaptic } from '../core/haptic-manager'
import { getReducedMotionDuration } from '../core/reduced-motion'
import { randomRange } from '../core/seeded-rng'
import { logEffectEnd, logEffectStart } from '../core/telemetry'
import { useUIConfig } from '@/hooks/use-ui-config'

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
  backdropBlur: SharedValue<number>
  bloomIntensity: SharedValue<number>
  saturation: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  open: () => void
  close: () => void
}

const DEFAULT_ENABLED = true
const ZOOM_DURATION_MIN = 240 // ms
const ZOOM_DURATION_MAX = 280 // ms
const DEFAULT_BLUR_RADIUS = 12 // px

export function useGlassMorphZoom(
  options: UseGlassMorphZoomOptions = {}
): UseGlassMorphZoomReturn {
  const {
    enabled = DEFAULT_ENABLED,
    blurRadius = DEFAULT_BLUR_RADIUS,
    onComplete,
  } = options

  // Get device refresh rate for adaptive animations
  const { hz, scaleDuration } = useDeviceRefreshRate()
  const { visual, feedback, animation } = useUIConfig()

  const scale = useSharedValue(1)
  const opacity = useSharedValue(0)
  const blurOpacity = useSharedValue(0)
  const backdropBlur = useSharedValue(0)
  const bloomIntensity = useSharedValue(0)
  const saturation = useSharedValue(1) // Base saturation, enhanced based on UI mode

  const open = useCallback(() => {
    if (!enabled) {
      return
    }

    // Calculate base duration
    const baseDuration =
      ZOOM_DURATION_MIN +
      randomRange(0, ZOOM_DURATION_MAX - ZOOM_DURATION_MIN)

    // Scale duration based on device refresh rate (adaptive)
    const scaledDuration = scaleDuration(baseDuration)
    const finalDuration = getReducedMotionDuration(scaledDuration, false)

    // Log effect start
    const effectId = logEffectStart('glass-morph-zoom', {
      blurRadius,
    })

    // Trigger haptic: Selection on open (only if haptics enabled)
    if (feedback.haptics) {
      triggerHaptic('selection')
    }

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

    // Blur backdrop fade in (only if blur enabled)
    if (visual.enableBlur) {
      blurOpacity.value = withTiming(1, {
        duration: finalDuration,
        easing: GLASS_ZOOM_EASING,
      })

      // Multi-pass backdrop blur animation (8-16px range)
      // Use adaptive blur based on device capability
      const targetBlur = Math.min(Math.max(blurRadius, 8), 16)
      backdropBlur.value = withTiming(targetBlur, {
        duration: finalDuration,
        easing: GLASS_ZOOM_EASING,
      })

      // Bloom effect (only if glow enabled)
      if (visual.enableGlow) {
        bloomIntensity.value = withTiming(0.5, {
          duration: finalDuration,
          easing: GLASS_ZOOM_EASING,
        })
      }

      // Enhanced saturation based on ABSOLUTE_MAX_UI_MODE
      saturation.value = withTiming(visual.backdropSaturation, {
        duration: finalDuration,
        easing: GLASS_ZOOM_EASING,
      })
    }

    // Call onComplete
    if (onComplete) {
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
    visual,
    feedback,
    scale,
    opacity,
    blurOpacity,
    backdropBlur,
    bloomIntensity,
    saturation,
    onComplete,
    scaleDuration,
  ])

  const close = useCallback(() => {
    if (!enabled) {
      return
    }

    // Scale duration based on device refresh rate (adaptive)
    const scaledDuration = scaleDuration(ZOOM_DURATION_MIN)
    const duration = getReducedMotionDuration(scaledDuration, false)

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

    // Reset backdrop blur
    backdropBlur.value = withTiming(0, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })

    // Reset bloom
    bloomIntensity.value = withTiming(0, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })

    // Reset saturation
    saturation.value = withTiming(1, {
      duration,
      easing: GLASS_ZOOM_EASING,
    })
  }, [enabled, visual, scale, opacity, blurOpacity, backdropBlur, bloomIntensity, saturation, scaleDuration])

  const animatedStyle = useAnimatedStyle(() => {
    // Chromatic aberration effect (subtle)
    const aberrationOffset = blurOpacity.value * 0.5 // 0-0.5px offset
    const filter = visual.enableGlow && bloomIntensity.value > 0
      ? `blur(${aberrationOffset}px) brightness(${1 + bloomIntensity.value * 0.1})`
      : `blur(${aberrationOffset}px)`

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      filter,
    }
  })

  const backdropStyle = useAnimatedStyle(() => {
    // Multi-layer backdrop blur with saturation
    const blurValue = backdropBlur.value
    const satValue = saturation.value
    const bloomValue = bloomIntensity.value

    // Create glass morphism effect with backdrop-filter
    // Multi-pass blur simulation using CSS filters
    const backdropFilter = visual.enableBlur
      ? `blur(${blurValue}px) saturate(${satValue * 180}%) brightness(${1 + bloomValue * 0.1})`
      : 'none'

    return {
      opacity: blurOpacity.value,
      backdropFilter,
      WebkitBackdropFilter: backdropFilter,
      backgroundColor: `rgba(255, 255, 255, ${blurOpacity.value * 0.1})`,
    }
  })

  return {
    scale,
    opacity,
    blurOpacity,
    backdropBlur,
    bloomIntensity,
    saturation,
    animatedStyle,
    backdropStyle,
    open,
    close,
  }
}
