/**
 * Haptic Manager — RN-friendly, web-safe, cooldown + reduced motion aware
 */

import { useEffect } from 'react'
import { isReduceMotionEnabled, useReducedMotion } from './reduced-motion'

// Lazy import haptics (Expo or custom wrapper), safe on web
let Haptics: any = null
try { 
  Haptics = require('expo-haptics') 
} catch {}

// Optional: your wrapper can still be used; fallback to Expo if present
let custom: any = null
try { 
  custom = require('@/lib/haptics') 
} catch {}

export type HapticType = 'selection' | 'light' | 'medium' | 'success'

/** monotonic time for precise cooldowns */
const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now())

export class HapticManager {
  private lastTs = -Infinity
  private cooldownMs: number
  private reduced = isReduceMotionEnabled()

  constructor(cooldownMs = 250) { 
    this.cooldownMs = cooldownMs 
  }

  updateReducedMotion(v?: boolean) {
    this.reduced = typeof v === 'boolean' ? v : isReduceMotionEnabled()
  }

  trigger(t: HapticType, bypassCooldown = false): boolean {
    if (this.reduced) return false

    const ts = now()
    if (!bypassCooldown && ts - this.lastTs < this.cooldownMs) return false

    try {
      // Prefer custom wrapper if available, else Expo Haptics
      if (custom?.haptics?.[t]) {
        custom.haptics[t]()
      } else if (Haptics) {
        switch (t) {
          case 'selection': 
            Haptics.selectionAsync?.()
            break
          case 'light':     
            Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)
            break
          case 'medium':    
            Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium)
            break
          case 'success':   
            Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)
            break
        }
      } else if (custom?.triggerHaptic) {
        // Fallback to web haptics wrapper
        custom.triggerHaptic(t)
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
