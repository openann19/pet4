/// <reference path="../../types/vendor/expo-haptics.d.ts" />

import { Platform } from 'react-native'
import { isReduceMotionEnabled } from '../reduced-motion'

// If using Expo: import * as Haptics from 'expo-haptics';
interface ExpoHaptics {
  impactAsync?: (style: number) => Promise<void>
  ImpactFeedbackStyle?: {
    Light: number
    Medium: number
    Heavy: number
  }
}

function isExpoHaptics(module: unknown): module is ExpoHaptics {
  return (
    typeof module === 'object' &&
    module !== null &&
    ('impactAsync' in module || 'ImpactFeedbackStyle' in module)
  )
}

let Haptics: ExpoHaptics | null = null
let hapticsLoadPromise: Promise<ExpoHaptics | null> | null = null

async function loadExpoHaptics(): Promise<ExpoHaptics | null> {
  if (Haptics !== null) return Haptics
  if (hapticsLoadPromise) return hapticsLoadPromise

  // Dynamic import with type assertion - module may not be available
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hapticsLoadPromise = (import('expo-haptics') as Promise<{ default?: ExpoHaptics; impactAsync?: ExpoHaptics['impactAsync']; ImpactFeedbackStyle?: ExpoHaptics['ImpactFeedbackStyle'] }>)
    .then(module => {
      const defaultExport = module.default ?? module
      if (isExpoHaptics(defaultExport)) {
        Haptics = defaultExport
      }
      return Haptics
    })
    .catch(() => {
      // expo-haptics not available
      return null
    })

  return hapticsLoadPromise
}

// Initialize on module load (non-blocking)
loadExpoHaptics().catch(() => {
  // Expected on web or when expo-haptics is not available
})

/**
 * Haptic feedback utilities.
 * Respects reduced motion preferences (no haptics when enabled).
 * Enforces 250ms cooldown to prevent haptic spam.
 */
let lastHapticTime = 0
const HAPTIC_COOLDOWN = 250

function shouldTriggerHaptic(): boolean {
  if (isReduceMotionEnabled()) {
    return false // No haptics when reduced motion is enabled
  }
  const now = Date.now()
  if (now - lastHapticTime < HAPTIC_COOLDOWN) {
    return false // Cooldown active
  }
  lastHapticTime = now
  return true
}

export const haptic = {
  light(): void {
    if (Platform.OS !== 'web' && Haptics?.impactAsync && shouldTriggerHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light ?? 0)
    }
  },
  medium(): void {
    if (Platform.OS !== 'web' && Haptics?.impactAsync && shouldTriggerHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Medium ?? 1)
    }
  },
  heavy(): void {
    if (Platform.OS !== 'web' && Haptics?.impactAsync && shouldTriggerHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Heavy ?? 2)
    }
  },
}
