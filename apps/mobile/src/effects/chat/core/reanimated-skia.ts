/**
 * Reanimated-Skia Bridge
 *
 * Synchronizes Reanimated SharedValues to Skia uniforms for GPU-accelerated effects.
 * Enables seamless integration between Reanimated animations and Skia shaders.
 *
 * Location: apps/mobile/src/effects/chat/core/reanimated-skia.ts
 */

import type { SharedValue } from '@petspark/motion'

/**
 * Hook to create a derived value from SharedValue<number> for Skia uniforms
 * Returns the SharedValue itself - components will use useAnimatedReaction to sync
 */
export function useSharedNumber(sv: SharedValue<number>, _fallback = 0): SharedValue<number> {
  return sv
}

/**
 * Hook to create a derived value from SharedValue<{x: number, y: number}> for Skia uniforms
 * Returns the SharedValue itself - components will use useAnimatedReaction to sync
 */
export function useSharedVec2(
  sv: SharedValue<{ x: number; y: number }>,
  _fallback = { x: 0, y: 0 }
): SharedValue<{ x: number; y: number }> {
  return sv
}
