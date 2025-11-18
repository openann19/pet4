/**
 * Message Status Ticks Effect Hook (Web)
 *
 * Creates a premium status tick animation with:
 * - Tick(s) morph from outline→solid with 120ms crossfade
 * - Color animates
 * - Web-compatible version
 *
 * Location: apps/web/src/effects/chat/status/use-status-ticks.ts
 */

import { useCallback, useEffect } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  _interpolate,
  _Extrapolation,
  type SharedValue,
} from '@petspark/motion'
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '../core/haptic-manager'
import {
  getReducedMotionDuration,
  useReducedMotionSV,
} from '../core/reduced-motion'
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate'
import { useUIConfig } from '@/hooks/use-ui-config'

const logger = createLogger('status-ticks')

/**
 * Status tick effect options
 */
export interface UseStatusTicksOptions {
  enabled?: boolean
  status: 'sending' | 'sent' | 'delivered' | 'read'
  previousStatus?: 'sending' | 'sent' | 'delivered' | 'read'
  isOwnMessage?: boolean
}

/**
 * Status tick effect return type
 */
export interface UseStatusTicksReturn {
  tick1Opacity: SharedValue<number>
  tick2Opacity: SharedValue<number>
  tick1Fill: SharedValue<number>
  tick2Fill: SharedValue<number>
  scale: SharedValue<number>
  color: SharedValue<string>
  colorR: SharedValue<number>
  colorG: SharedValue<number>
  colorB: SharedValue<number>
  colorProgress: SharedValue<number>
  prevColorR: SharedValue<number>
  prevColorG: SharedValue<number>
  prevColorB: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  getInterpolatedColor: () => string
}

const DEFAULT_ENABLED = true
const CROSSFADE_DURATION = 120 // ms

export function useStatusTicks(
  options: UseStatusTicksOptions
): UseStatusTicksReturn {
  const {
    enabled = DEFAULT_ENABLED,
    status,
    previousStatus,
    isOwnMessage = false,
  } = options

  const reducedMotion = useReducedMotionSV()
  const { scaleDuration } = useDeviceRefreshRate()
  const { feedback, theme } = useUIConfig()

  // Tick opacity (for outline→solid transition)
  const tick1Opacity = useSharedValue(1)
  const tick2Opacity = useSharedValue(1)

  // Tick fill (0 = outline, 1 = solid) - for SVG path morphing
  const tick1Fill = useSharedValue(0)
  const tick2Fill = useSharedValue(0)

  // Scale for micro-interaction feedback
  const scale = useSharedValue(1)

  // Color interpolation values (for smooth color transitions)
  const colorR = useSharedValue(102) // #666666 RGB components
  const colorG = useSharedValue(102)
  const colorB = useSharedValue(102)

  // Previous color for interpolation
  const prevColorR = useSharedValue(102)
  const prevColorG = useSharedValue(102)
  const prevColorB = useSharedValue(102)

  // Color transition progress (0-1)
  const colorProgress = useSharedValue(1) // Start at 1 (no interpolation initially)

  // Color string (for backward compatibility)
  const color = useSharedValue('#666666')

  const updateStatus = useCallback(() => {
    if (!enabled) {
      return
    }

    const isReducedMotion = reducedMotion.value > 0;
    // Use adaptive duration scaling based on device refresh rate
    const baseDuration = getReducedMotionDuration(CROSSFADE_DURATION, isReducedMotion);
    const duration = scaleDuration(baseDuration)

    // Determine tick states based on status
    let newTick1Fill = 0
    let newTick2Fill = 0
    let newColor = '#666666'

    switch (status) {
      case 'sending':
        newTick1Fill = 0
        newTick2Fill = 0
        newColor = '#999999'
        break
      case 'sent':
        newTick1Fill = 1
        newTick2Fill = 0
        newColor = '#666666'
        break
      case 'delivered':
        newTick1Fill = 1
        newTick2Fill = 1
        newColor = '#666666'
        break
      case 'read':
        newTick1Fill = 1
        newTick2Fill = 1
        newColor = '#3B82F6' // blue
        break
    }

    // Parse new color to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (!result) {
        return [102, 102, 102] // Default gray
      }
      return [
        parseInt(result[1] ?? '66', 16),
        parseInt(result[2] ?? '66', 16),
        parseInt(result[3] ?? '66', 16),
      ]
    }

    const [targetR, targetG, targetB] = hexToRgb(newColor)

    // Store previous color values for interpolation
    prevColorR.value = colorR.value
    prevColorG.value = colorG.value
    prevColorB.value = colorB.value

    // Animate fill with bezier interpolation for smooth morphing
    tick1Fill.value = withTiming(newTick1Fill, {
      duration,
      easing: isReducedMotion
        ? Easing.linear
        : Easing.ease, // Smooth easing for morphing
    })
    tick2Fill.value = withTiming(newTick2Fill, {
      duration,
      easing: isReducedMotion
        ? Easing.linear
        : Easing.ease, // Smooth easing for morphing
    })

    // Animate color with smooth interpolation
    colorProgress.value = 0
    colorProgress.value = withTiming(1, {
      duration,
      easing: isReducedMotion
        ? Easing.linear
        : Easing.inOut(Easing.ease),
    })

    // Update color values with interpolation (will be computed in animatedStyle)
    colorR.value = targetR
    colorG.value = targetG
    colorB.value = targetB

    // Micro-interaction: Scale on status change for visual feedback
    if (!isReducedMotion && status !== previousStatus) {
      // Use sequence for proper scale animation
      scale.value = withTiming(1.15, {
        duration: duration / 4,
        easing: Easing.out(Easing.ease),
      })
      // Scale back with delay
      setTimeout(() => {
        scale.value = withTiming(1, {
          duration: (duration * 3) / 4,
          easing: Easing.inOut(Easing.ease),
        })
      }, duration / 4)
    }

    // Trigger haptic on "Delivered→Read" transition (only for own messages and if haptics enabled)
    if (
      isOwnMessage &&
      previousStatus === 'delivered' &&
      status === 'read' &&
      feedback.haptics
    ) {
      triggerHaptic('selection')
      logger.debug('Status changed to read, haptic triggered')
    }
  }, [
    enabled,
    reducedMotion,
    scaleDuration,
    feedback.haptics,
    status,
    previousStatus,
    isOwnMessage,
    tick1Fill,
    tick2Fill,
    scale,
    colorR,
    colorG,
    colorB,
    colorProgress,
    prevColorR,
    prevColorG,
    prevColorB,
  ])

  useEffect(() => {
    updateStatus()
  }, [updateStatus])

  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate color smoothly
    const r = Math.round(
      prevColorR.value + (colorR.value - prevColorR.value) * colorProgress.value
    )
    const g = Math.round(
      prevColorG.value + (colorG.value - prevColorG.value) * colorProgress.value
    )
    const b = Math.round(
      prevColorB.value + (colorB.value - prevColorB.value) * colorProgress.value
    )

    // Update color string
    color.value = `#${[r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')}`

    return {
      opacity: Math.min(tick1Opacity.value, tick2Opacity.value),
      transform: [{ scale: scale.value }],
    }
  })

  // Helper function to get interpolated color (for use in components)
  const getInterpolatedColor = useCallback((): string => {
    const r = Math.round(
      prevColorR.value + (colorR.value - prevColorR.value) * colorProgress.value
    )
    const g = Math.round(
      prevColorG.value + (colorG.value - prevColorG.value) * colorProgress.value
    )
    const b = Math.round(
      prevColorB.value + (colorB.value - prevColorB.value) * colorProgress.value
    )
    return `rgb(${r}, ${g}, ${b})`
  }, [prevColorR, prevColorG, prevColorB, colorR, colorG, colorB, colorProgress])

  return {
    tick1Opacity,
    tick2Opacity,
    tick1Fill,
    tick2Fill,
    scale,
    color,
    colorR,
    colorG,
    colorB,
    colorProgress,
    prevColorR,
    prevColorG,
    prevColorB,
    animatedStyle,
    getInterpolatedColor,
  }
}
