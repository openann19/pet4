/**
 * Gesture Conflict Guard
 *
 * Prevents accidental gesture triggers by distinguishing between horizontal
 * and vertical gestures. Useful for swipe-to-reply vs list scroll conflicts.
 *
 * Location: apps/mobile/src/effects/chat/gestures/use-gesture-guard.ts
 */

import { useRef } from 'react'

export interface GestureGuard {
  onStart: (x: number, y: number) => void
  allowHorizontal: (x: number, y: number) => boolean
  allowVertical: (x: number, y: number) => boolean
}

/**
 * Hook to guard against accidental gesture conflicts
 *
 * Tracks initial touch position and determines if gesture should be allowed
 * based on movement direction and threshold.
 *
 * @param threshold - Minimum movement distance in pixels before allowing gesture (default: 6)
 * @returns Gesture guard object with tracking methods
 *
 * @example
 * ```typescript
 * const guard = useGestureGuard(6)
 *
 * const onGestureStart = (event) => {
 *   guard.onStart(event.x, event.y)
 * }
 *
 * const onGestureMove = (event) => {
 *   if (guard.allowHorizontal(event.x, event.y)) {
 *     // Allow swipe-to-reply
 *   } else if (guard.allowVertical(event.x, event.y)) {
 *     // Allow list scroll
 *   }
 * }
 * ```
 */
export function useGestureGuard(threshold = 6): GestureGuard {
  const ax = useRef(0)
  const ay = useRef(0)

  return {
    onStart: (x: number, y: number): void => {
      ax.current = x
      ay.current = y
    },

    allowHorizontal: (x: number, y: number): boolean => {
      const dx = Math.abs(x - ax.current)
      const dy = Math.abs(y - ay.current)

      // Horizontal movement must be dominant and exceed threshold
      return dx > threshold && dx > dy * 1.5
    },

    allowVertical: (x: number, y: number): boolean => {
      const dx = Math.abs(x - ax.current)
      const dy = Math.abs(y - ay.current)

      // Vertical movement must be dominant and exceed threshold
      return dy > threshold && dy > dx * 1.5
    },
  }
}
