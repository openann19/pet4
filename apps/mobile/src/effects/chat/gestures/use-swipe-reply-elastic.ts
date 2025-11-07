/**
 * Swipe-to-Reply "Elastic Rail" Effect Hook
 * 
 * Creates a premium swipe-to-reply gesture with:
 * - BG track stretches with rubber-band beyond 24px, max 56px
 * - Trigger threshold 40px
 * - Haptic Light on crossing threshold
 * - Snap-back spring 280/18
 * - Skia ribbon shader follows finger if dragged
 * 
 * Location: apps/mobile/src/effects/chat/gestures/use-swipe-reply-elastic.ts
 */

import { useCallback, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'
import { createLogger } from '../../../utils/logger'
import { triggerHaptic } from '../core/haptic-manager'
import { useReducedMotionSV } from '../core/reduced-motion'
import { createAnimatedRibbonPath, getRibbonConfig } from '../shaders/ribbon-fx'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('swipe-reply-elastic')

/**
 * Spring configuration for snap-back
 * Stiffness: 280, Damping: 18
 */
const SNAP_BACK_SPRING = {
  stiffness: 280,
  damping: 18,
  mass: 1.0,
}

/**
 * Swipe reply elastic effect options
 */
export interface UseSwipeReplyElasticOptions {
  enabled?: boolean
  onThresholdCross?: () => void
  onReply?: () => void
  bubbleWidth?: number // Optional bubble width for accurate ribbon positioning
  bubbleHeight?: number // Optional bubble height for accurate ribbon positioning
}

/**
 * Swipe reply elastic effect return type
 */
export interface UseSwipeReplyElasticReturn {
  translateX: SharedValue<number>
  railStretch: SharedValue<number>
  ribbonPath: SharedValue<string | null>
  // RibbonFX shared values
  ribbonP0: SharedValue<{ x: number; y: number }>
  ribbonP1: SharedValue<{ x: number; y: number }>
  ribbonThickness: SharedValue<number>
  ribbonGlow: SharedValue<number>
  ribbonProgress: SharedValue<number>
  ribbonAlpha: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Pan>
}

const DEFAULT_ENABLED = true
const BASE_THRESHOLD = 24 // px
const MAX_STRETCH = 56 // px
const TRIGGER_THRESHOLD = 40 // px

export function useSwipeReplyElastic(
  options: UseSwipeReplyElasticOptions = {}
): UseSwipeReplyElasticReturn {
  const { enabled = DEFAULT_ENABLED, onThresholdCross, onReply, bubbleWidth = 200, bubbleHeight = 60 } = options

  const reducedMotion = useReducedMotionSV()
  const translateX = useSharedValue(0)
  const railStretch = useSharedValue(0)
  const ribbonPath = useSharedValue<string | null>(null)
  
  // RibbonFX shared values
  const ribbonP0 = useSharedValue({ x: 0, y: 0 })
  const ribbonP1 = useSharedValue({ x: 0, y: 0 })
  const ribbonThickness = useSharedValue(8)
  const ribbonGlow = useSharedValue(Math.min(18, 24)) // Respect <= 24px constraint
  const ribbonProgress = useSharedValue(0)
  const ribbonAlpha = useSharedValue(0) // Start hidden

  const thresholdCrossedRef = useRef(false)
  const gesturePointsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([])

  const handleThresholdCross = useCallback(() => {
    if (!thresholdCrossedRef.current) {
      thresholdCrossedRef.current = true
      triggerHaptic('light')
      onThresholdCross?.()
      logger.debug('Swipe threshold crossed')
    }
  }, [onThresholdCross])

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      if (isTruthy(reducedMotion.value)) {
        return
      }

      const dragX = Math.max(0, event.translationX) // Only allow right swipe

      // Calculate rubber-band stretch
      if (dragX <= BASE_THRESHOLD) {
        railStretch.value = dragX
      } else {
        // Rubber-band effect: resistance increases beyond threshold
        const excess = dragX - BASE_THRESHOLD
        const resistance = 0.3 // resistance factor
        railStretch.value = BASE_THRESHOLD + excess * resistance
        railStretch.value = Math.min(railStretch.value, MAX_STRETCH)
      }

      translateX.value = railStretch.value

      // Update ribbon points and progress
      // p0: starting point (bubble left edge, center)
      // p1: finger position relative to bubble (projected onto bubble bounds)
      // Note: These coordinates are relative to the bubble canvas (bubbleWidth x bubbleHeight)
      const centerY = bubbleHeight / 2
      ribbonP0.value = { x: 0, y: centerY } // Start at left edge, center
      ribbonP1.value = { x: Math.min(dragX, bubbleWidth), y: centerY } // Follow drag, clamped to bubble width
      
      // Progress based on drag distance (0 to 1)
      const maxDrag = 100 // max drag distance for full progress
      ribbonProgress.value = Math.min(1, dragX / maxDrag)
      
      // Alpha fades in as user drags
      ribbonAlpha.value = Math.min(1, dragX / 40) // Full alpha at 40px
      
      // Track gesture points for ribbon
      gesturePointsRef.current.push({
        x: event.absoluteX,
        y: event.absoluteY,
        timestamp: Date.now(),
      })

      // Keep only last 20 points
      if (gesturePointsRef.current.length > 20) {
        gesturePointsRef.current.shift()
      }

      // Update ribbon path (for backwards compatibility with path-based rendering)
      createAnimatedRibbonPath(
        gesturePointsRef.current,
        Date.now(),
        180,
        getRibbonConfig({ width: 3, color: '#3B82F6', opacity: 0.6 })
      )
      // Convert path to string representation (simplified)
      ribbonPath.value = JSON.stringify(gesturePointsRef.current)

      // Check threshold
      if (railStretch.value >= TRIGGER_THRESHOLD && !thresholdCrossedRef.current) {
        runOnJS(handleThresholdCross)()
      }
    })
    .onEnd(() => {
      thresholdCrossedRef.current = false

      // Snap back
      translateX.value = withSpring(0, SNAP_BACK_SPRING)
      railStretch.value = withSpring(0, SNAP_BACK_SPRING)
      ribbonPath.value = null
      ribbonProgress.value = withSpring(0, SNAP_BACK_SPRING)
      ribbonAlpha.value = withSpring(0, SNAP_BACK_SPRING)
      gesturePointsRef.current = []

      // Trigger reply if past threshold
      if (railStretch.value >= TRIGGER_THRESHOLD) {
        onReply?.()
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return {
    translateX,
    railStretch,
    ribbonPath,
    ribbonP0,
    ribbonP1,
    ribbonThickness,
    ribbonGlow,
    ribbonProgress,
    ribbonAlpha,
    animatedStyle,
    gesture,
  }
}

