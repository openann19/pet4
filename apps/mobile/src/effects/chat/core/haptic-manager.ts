/**
 * Haptic Manager — RN-friendly, web-safe, cooldown + reduced motion aware
 */

import { useEffect } from 'react'
import { isReduceMotionEnabled, useReducedMotion } from './reduced-motion'
import { importOptional } from '@/utils/optional-imports'

// Lazy import haptics (Expo or custom wrapper), safe on web
interface ExpoHaptics {
  selectionAsync?: () => Promise<void>
  impactAsync?: (style: number) => Promise<void>
  notificationAsync?: (type: number) => Promise<void>
  ImpactFeedbackStyle?: {
    Light: number
    Medium: number
  }
  NotificationFeedbackType?: {
    Success: number
  }
}

interface CustomHaptics {
  haptics?: {
    selection?: () => void
    light?: () => void
    medium?: () => void
    success?: () => void
  }
}

function isExpoHaptics(module: unknown): module is ExpoHaptics {
  return (
    typeof module === 'object' &&
    module !== null &&
    ('selectionAsync' in module || 'impactAsync' in module || 'NotificationFeedbackType' in module)
  )
}

function isCustomHaptics(module: unknown): module is CustomHaptics {
  return (
    typeof module === 'object' &&
    module !== null &&
    'haptics' in module &&
    typeof (module as { haptics?: unknown }).haptics === 'object'
  )
}

let Haptics: ExpoHaptics | null = null
let hapticsLoadPromise: Promise<ExpoHaptics | null> | null = null

async function loadExpoHaptics(): Promise<ExpoHaptics | null> {
  if (Haptics !== null) return Haptics
  if (hapticsLoadPromise) return hapticsLoadPromise

  hapticsLoadPromise = importOptional<ExpoHaptics>('expo-haptics', isExpoHaptics)
  Haptics = await hapticsLoadPromise
  return Haptics
}

// Initialize on module load (non-blocking)
loadExpoHaptics().catch(() => {
  // Expected on web or when expo-haptics is not available
})

let custom: CustomHaptics | null = null
let customHapticsLoadPromise: Promise<CustomHaptics | null> | null = null

async function loadCustomHaptics(): Promise<CustomHaptics | null> {
  if (custom !== null) return custom
  if (customHapticsLoadPromise) return customHapticsLoadPromise

  customHapticsLoadPromise = importOptional<CustomHaptics>('@/lib/haptics', isCustomHaptics)
  custom = await customHapticsLoadPromise
  return custom
}

// Initialize on module load (non-blocking)
loadCustomHaptics().catch(() => {
  // Expected when custom haptics wrapper is not available
})

export type HapticType = 'selection' | 'light' | 'medium' | 'success'

/** monotonic time for precise cooldowns */
const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()

export class HapticManager {
  private lastTs = -Infinity
  private cooldownMs: number
  private reduced = isReduceMotionEnabled()

  constructor(cooldownMs = 250) {
    this.cooldownMs = cooldownMs
  }

  updateReducedMotion(v?: boolean): void {
    this.reduced = typeof v === 'boolean' ? v : isReduceMotionEnabled()
  }

  async triggerAsync(t: HapticType, bypassCooldown = false): Promise<boolean> {
    if (this.reduced) return false

    const ts = now()
    if (!bypassCooldown && ts - this.lastTs < this.cooldownMs) return false

    try {
      // Ensure haptics are loaded
      await Promise.all([loadCustomHaptics(), loadExpoHaptics()])

      // Prefer custom wrapper if available, else Expo Haptics
      if (custom?.haptics?.[t]) {
        custom.haptics[t]?.()
      } else if (Haptics) {
        switch (t) {
          case 'selection':
            await Haptics.selectionAsync?.()
            break
          case 'light':
            if (Haptics.ImpactFeedbackStyle) {
              await Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)
            }
            break
          case 'medium':
            if (Haptics.ImpactFeedbackStyle) {
              await Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)
            }
            break
          case 'success':
            if (Haptics.NotificationFeedbackType) {
              await Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)
            }
            break
        }
      } else {
        // web/no-op
        return false
      }

      this.lastTs = ts
      return true
    } catch {
      return false
    }
  }

  trigger(t: HapticType, bypassCooldown = false): boolean {
    // Fire and forget for synchronous API compatibility
    this.triggerAsync(t, bypassCooldown).catch(() => {
      // Silent fail
    })

    // Return immediately if cooldown would prevent trigger
    if (this.reduced) return false
    const ts = now()
    if (!bypassCooldown && ts - this.lastTs < this.cooldownMs) return false

    // Update timestamp optimistically
    this.lastTs = ts
    return true
  }

  getTimeSinceLastTrigger(): number {
    return now() - this.lastTs
  }

  isCooldownActive(): boolean {
    return this.getTimeSinceLastTrigger() < this.cooldownMs
  }

  resetCooldown(): void {
    this.lastTs = -Infinity
  }
}

let singleton: HapticManager | null = null

export function getHapticManager(): HapticManager {
  return (singleton ??= new HapticManager())
}

export function triggerHaptic(type: HapticType, bypassCooldown = false): boolean {
  return getHapticManager().trigger(type, bypassCooldown)
}

/** React hook to auto-sync reduced motion with the singleton */
export function useHapticManager(): HapticManager {
  const reduced = useReducedMotion()
  const mgr = getHapticManager()

  useEffect(() => {
    mgr.updateReducedMotion(reduced)
  }, [reduced, mgr])

  return mgr
}
