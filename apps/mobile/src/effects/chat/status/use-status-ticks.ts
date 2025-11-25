/**
 * Message Status Ticks Effect Hook
 *
 * Creates a premium status tick animation with:
 * - Tick(s) morph from outline→solid with 120ms crossfade
 * - Color animates
 * - Haptic Selection only on sender when "Delivered→Read"
 *
 * Location: apps/mobile/src/effects/chat/status/use-status-ticks.ts
 */

import { useCallback, useEffect } from 'react'
import { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from '@petspark/motion'
import { createLogger } from '../../../utils/logger'
import { triggerHaptic } from '../core/haptic-manager'
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion'

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
  color: SharedValue<string>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

const DEFAULT_ENABLED = true
const CROSSFADE_DURATION = 120 // ms

export function useStatusTicks(options: UseStatusTicksOptions): UseStatusTicksReturn {
  const { enabled = DEFAULT_ENABLED, status, previousStatus, isOwnMessage = false } = options

  const reducedMotion = useReducedMotionSV()

  // Tick opacity (for outline→solid transition)
  const tick1Opacity = useSharedValue(1)
  const tick2Opacity = useSharedValue(1)

  // Tick fill (0 = outline, 1 = solid)
  const tick1Fill = useSharedValue(0)
  const tick2Fill = useSharedValue(0)

  // Color (changes when read)
  const color = useSharedValue('#666666')

  const updateStatus = useCallback(() => {
    if (!enabled) {
      return
    }

    const isReducedMotion = reducedMotion.value
    const duration = getReducedMotionDuration(CROSSFADE_DURATION, isReducedMotion)

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

    // Animate fill
    tick1Fill.value = withTiming(newTick1Fill, {
      duration,
      easing: isReducedMotion ? Easing.linear : Easing.inOut(Easing.ease),
    })
    tick2Fill.value = withTiming(newTick2Fill, {
      duration,
      easing: isReducedMotion ? Easing.linear : Easing.inOut(Easing.ease),
    })

    // Animate color
    color.value = newColor // Direct assignment for color (can't animate string in Reanimated)

    // Trigger haptic on "Delivered→Read" transition (only for own messages)
    if (isOwnMessage && previousStatus === 'delivered' && status === 'read') {
      triggerHaptic('selection')
      logger.debug('Status changed to read, haptic triggered')
    }
  }, [enabled, reducedMotion, status, previousStatus, isOwnMessage, tick1Fill, tick2Fill, color])

  useEffect(() => {
    updateStatus()
  }, [updateStatus])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.min(tick1Opacity.value, tick2Opacity.value),
    }
  })

  return {
    tick1Opacity,
    tick2Opacity,
    tick1Fill,
    tick2Fill,
    color,
    animatedStyle,
  }
}
