/**
 * Advanced Drag & Drop Hook (Web)
 *
 * Provides comprehensive drag and drop functionality with:
 * - Smooth drag physics with momentum
 * - Snap points and boundaries
 * - Visual feedback (shadow, scale)
 * - Drop zones with validation
 * - Haptic feedback
 * - Accessibility support
 *
 * Location: apps/web/src/hooks/gestures/use-drag-drop.ts
 */

import { useCallback, useRef, useState } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from '@petspark/motion'
import { createLogger } from '@/lib/logger'
import { triggerHapticByContext } from '@/effects/chat/core/haptic-manager'
import { useUIConfig } from '@/hooks/use-ui-config'
import { useSoundFeedback } from '@/hooks/use-sound-feedback'

const logger = createLogger('drag-drop')

/**
 * Drop zone configuration
 */
export interface DropZone {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly accepts?: readonly string[] // Item types that can be dropped
  readonly onDrop?: (item: DragItem) => void
  readonly onEnter?: (item: DragItem) => void
  readonly onLeave?: (item: DragItem) => void
}

/**
 * Draggable item data
 */
export interface DragItem {
  readonly id: string
  readonly type: string
  readonly data?: Record<string, unknown>
}

/**
 * Snap point configuration
 */
export interface SnapPoint {
  readonly x: number
  readonly y: number
  readonly threshold?: number // Distance threshold for snapping
}

/**
 * Drag & drop options
 */
export interface UseDragDropOptions {
  readonly enabled?: boolean
  readonly item?: DragItem
  readonly dropZones?: readonly DropZone[]
  readonly snapPoints?: readonly SnapPoint[]
  readonly boundaries?: {
    readonly minX?: number
    readonly maxX?: number
    readonly minY?: number
    readonly maxY?: number
  }
  readonly dragThreshold?: number // Minimum distance before drag starts
  readonly snapThreshold?: number // Distance to snap point
  readonly enableMomentum?: boolean
  readonly onDragStart?: (item: DragItem) => void
  readonly onDragEnd?: (item: DragItem, dropZone?: DropZone) => void
  readonly onDrop?: (item: DragItem, dropZone: DropZone) => void
}

/**
 * Drag & drop return type
 */
export interface UseDragDropReturn {
  readonly translateX: SharedValue<number>
  readonly translateY: SharedValue<number>
  readonly scale: SharedValue<number>
  readonly shadowOpacity: SharedValue<number>
  readonly isDragging: boolean
  readonly currentDropZone: DropZone | null
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>
  readonly dragHandlers: {
    readonly onPointerDown: (e: PointerEvent) => void
    readonly onPointerMove: (e: PointerEvent) => void
    readonly onPointerUp: (e: PointerEvent) => void
    readonly onPointerCancel: (e: PointerEvent) => void
  }
  readonly reset: () => void
}

const DEFAULT_ENABLED = true
const DEFAULT_DRAG_THRESHOLD = 5 // px
const DEFAULT_SNAP_THRESHOLD = 50 // px
const DRAG_SCALE = 1.05
const SHADOW_OPACITY = 0.3

export function useDragDrop(
  options: UseDragDropOptions = {}
): UseDragDropReturn {
  const {
    enabled = DEFAULT_ENABLED,
    item,
    dropZones = [],
    snapPoints = [],
    boundaries,
    dragThreshold = DEFAULT_DRAG_THRESHOLD,
    snapThreshold = DEFAULT_SNAP_THRESHOLD,
    enableMomentum = true,
    onDragStart,
    onDragEnd,
    onDrop,
  } = options

  const { feedback } = useUIConfig()
  const { playSwipe, playSuccess } = useSoundFeedback()

  // Transform values
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const shadowOpacity = useSharedValue(0)

  // State
  const [isDragging, setIsDragging] = useState(false)
  const [currentDropZone, setCurrentDropZone] = useState<DropZone | null>(null)

  // Tracking refs
  const initialPosRef = useRef<{ x: number; y: number } | null>(null)
  const lastPosRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isDraggingRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)

  // Find drop zone at position
  const findDropZoneAtPosition = useCallback(
    (x: number, y: number): DropZone | null => {
      for (const zone of dropZones) {
        if (
          x >= zone.x &&
          x <= zone.x + zone.width &&
          y >= zone.y &&
          y <= zone.y + zone.height
        ) {
          // Check if item type is accepted
          if (item && zone.accepts && !zone.accepts.includes(item.type)) {
            continue
          }
          return zone
        }
      }
      return null
    },
    [dropZones, item]
  )

  // Find nearest snap point
  const findNearestSnapPoint = useCallback(
    (x: number, y: number): SnapPoint | null => {
      let nearest: SnapPoint | null = null
      let minDistance = Infinity

      for (const snap of snapPoints) {
        const threshold = snap.threshold ?? snapThreshold
        const dx = x - snap.x
        const dy = y - snap.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < threshold && distance < minDistance) {
          nearest = snap
          minDistance = distance
        }
      }

      return nearest
    },
    [snapPoints, snapThreshold]
  )

  // Apply boundaries
  const applyBoundaries = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      let boundedX = x
      let boundedY = y

      if (boundaries) {
        if (boundaries.minX !== undefined) {
          boundedX = Math.max(boundaries.minX, boundedX)
        }
        if (boundaries.maxX !== undefined) {
          boundedX = Math.min(boundaries.maxX, boundedX)
        }
        if (boundaries.minY !== undefined) {
          boundedY = Math.max(boundaries.minY, boundedY)
        }
        if (boundaries.maxY !== undefined) {
          boundedY = Math.min(boundaries.maxY, boundedY)
        }
      }

      return { x: boundedX, y: boundedY }
    },
    [boundaries]
  )

  // Pointer down handler
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!enabled || !item) {
        return
      }

      e.preventDefault()
      activePointerIdRef.current = e.pointerId

      initialPosRef.current = { x: e.clientX, y: e.clientY }
      lastPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }

      if (feedback.haptics) {
        triggerHapticByContext('tap')
      }
      if (feedback.sound) {
        playSwipe().catch(() => {
          // Silent fail
        })
      }

      logger.debug('Drag initialized', { item: item.id })
    },
    [enabled, item, feedback.haptics]
  )

  // Pointer move handler
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (
        !enabled ||
        !item ||
        activePointerIdRef.current !== e.pointerId ||
        !initialPosRef.current
      ) {
        return
      }

      e.preventDefault()

      const dx = e.clientX - initialPosRef.current.x
      const dy = e.clientY - initialPosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Start dragging if threshold exceeded
      if (!isDraggingRef.current && distance > dragThreshold) {
        isDraggingRef.current = true
        setIsDragging(true)

        // Visual feedback
        scale.value = withSpring(DRAG_SCALE, {
          damping: 15,
          stiffness: 200,
        })
        shadowOpacity.value = withTiming(SHADOW_OPACITY, { duration: 150 })

        if (feedback.haptics) {
          triggerHapticByContext('swipe')
        }
        if (feedback.sound) {
          playSwipe().catch(() => {
            // Silent fail
          })
        }

        onDragStart?.(item)

        logger.debug('Drag started', { item: item.id })
      }

      if (isDraggingRef.current) {
        // Update position
        lastPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }

        // Apply boundaries
        const bounded = applyBoundaries(dx, dy)
        translateX.value = bounded.x
        translateY.value = bounded.y

        // Check drop zones
        const dropZone = findDropZoneAtPosition(e.clientX, e.clientY)

        if (dropZone !== currentDropZone) {
          if (currentDropZone) {
            currentDropZone.onLeave?.(item)
          }

          setCurrentDropZone(dropZone)

          if (dropZone) {
            dropZone.onEnter?.(item)

            if (feedback.haptics) {
              triggerHapticByContext('threshold')
            }
            if (feedback.sound) {
              playSwipe().catch(() => {
                // Silent fail
              })
            }

            logger.debug('Entered drop zone', {
              item: item.id,
              zone: dropZone.id,
            })
          }
        }
      }
    },
    [
      enabled,
      item,
      dragThreshold,
      feedback.haptics,
      scale,
      shadowOpacity,
      translateX,
      translateY,
      applyBoundaries,
      findDropZoneAtPosition,
      currentDropZone,
      onDragStart,
    ]
  )

  // Pointer up handler
  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!enabled || activePointerIdRef.current !== e.pointerId) {
        return
      }

      e.preventDefault()
      activePointerIdRef.current = null

      if (isDraggingRef.current && item) {
        isDraggingRef.current = false
        setIsDragging(false)

        // Calculate velocity for momentum
        let velocity = { x: 0, y: 0 }
        if (enableMomentum && lastPosRef.current && initialPosRef.current) {
          const dt = Date.now() - lastPosRef.current.time
          if (dt > 0) {
            const dx = lastPosRef.current.x - initialPosRef.current.x
            const dy = lastPosRef.current.y - initialPosRef.current.y
            velocity = { x: dx / dt, y: dy / dt }
          }
        }

        // Check for drop
        if (currentDropZone) {
          currentDropZone.onDrop?.(item)
          onDrop?.(item, currentDropZone)

          if (feedback.haptics) {
            triggerHapticByContext('success')
          }
          if (feedback.sound) {
            playSuccess().catch(() => {
              // Silent fail
            })
          }

          logger.debug('Item dropped', {
            item: item.id,
            zone: currentDropZone.id,
          })

          setCurrentDropZone(null)
        }

        onDragEnd?.(item, currentDropZone ?? undefined)

        // Check for snap points
        const snapPoint = findNearestSnapPoint(
          translateX.value,
          translateY.value
        )

        if (snapPoint) {
          // Snap to point
          translateX.value = withSpring(snapPoint.x, {
            damping: 20,
            stiffness: 300,
          })
          translateY.value = withSpring(snapPoint.y, {
            damping: 20,
            stiffness: 300,
          })

          if (feedback.haptics) {
            triggerHapticByContext('threshold')
          }
          if (feedback.sound) {
            playSwipe().catch(() => {
              // Silent fail
            })
          }

          logger.debug('Snapped to point', { x: snapPoint.x, y: snapPoint.y })
        } else if (enableMomentum && Math.abs(velocity.x) + Math.abs(velocity.y) > 0.5) {
          // Apply momentum
          const finalX = translateX.value + velocity.x * 200
          const finalY = translateY.value + velocity.y * 200
          const bounded = applyBoundaries(finalX, finalY)

          translateX.value = withSpring(bounded.x, {
            damping: 20,
            stiffness: 200,
          })
          translateY.value = withSpring(bounded.y, {
            damping: 20,
            stiffness: 200,
          })
        } else {
          // Spring back to origin
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
          translateY.value = withSpring(0, { damping: 20, stiffness: 200 })
        }

        // Reset visual feedback
        scale.value = withSpring(1, { damping: 15, stiffness: 200 })
        shadowOpacity.value = withTiming(0, { duration: 150 })

        logger.debug('Drag ended', { item: item.id })
      }

      initialPosRef.current = null
      lastPosRef.current = null
    },
    [
      enabled,
      item,
      currentDropZone,
      enableMomentum,
      feedback.haptics,
      translateX,
      translateY,
      scale,
      shadowOpacity,
      applyBoundaries,
      findNearestSnapPoint,
      onDragEnd,
      onDrop,
    ]
  )

  // Pointer cancel handler
  const onPointerCancel = useCallback(
    (e: PointerEvent) => {
      if (!enabled || activePointerIdRef.current !== e.pointerId) {
        return
      }

      activePointerIdRef.current = null
      isDraggingRef.current = false
      setIsDragging(false)
      setCurrentDropZone(null)

      // Reset immediately
      translateX.value = withTiming(0, { duration: 150 })
      translateY.value = withTiming(0, { duration: 150 })
      scale.value = withTiming(1, { duration: 150 })
      shadowOpacity.value = withTiming(0, { duration: 150 })

      initialPosRef.current = null
      lastPosRef.current = null

      logger.debug('Drag cancelled')
    },
    [enabled, translateX, translateY, scale, shadowOpacity]
  )

  // Reset function
  const reset = useCallback(() => {
    activePointerIdRef.current = null
    isDraggingRef.current = false
    setIsDragging(false)
    setCurrentDropZone(null)

    translateX.value = 0
    translateY.value = 0
    scale.value = 1
    shadowOpacity.value = 0

    initialPosRef.current = null
    lastPosRef.current = null
  }, [translateX, translateY, scale, shadowOpacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      shadowOpacity: shadowOpacity.value,
    }
  })

  return {
    translateX,
    translateY,
    scale,
    shadowOpacity,
    isDragging,
    currentDropZone,
    animatedStyle,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    reset,
  }
}
