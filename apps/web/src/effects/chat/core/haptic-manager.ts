/**
 * Haptic Manager — RN-friendly, web-safe, cooldown + reduced motion aware
 */

import { useEffect } from 'react';
import { isReduceMotionEnabled, useReducedMotion } from './reduced-motion';

// Type definitions for optional haptics imports
interface ExpoHaptics {
  selectionAsync?: () => Promise<void>;
  impactAsync?: (style: number) => Promise<void>;
  notificationAsync?: (type: number) => Promise<void>;
  ImpactFeedbackStyle?: {
    Light: number;
    Medium: number;
    Heavy: number;
  };
  NotificationFeedbackType?: {
    Success: number;
    Warning: number;
    Error: number;
  };
}

interface CustomHaptics {
  haptics?: {
    selection?: () => void;
    light?: () => void;
    medium?: () => void;
    success?: () => void;
  };
}

// Web environment - haptics not available natively
// Haptics will be null on web, which is expected
const Haptics: ExpoHaptics | null = null;

async function loadExpoHaptics(): Promise<ExpoHaptics | null> {
  // On web, expo-haptics is never available
  // Return null immediately without attempting import
  return null;
}

let custom: CustomHaptics | null = null;
let customHapticsLoadPromise: Promise<CustomHaptics | null> | null = null;

async function loadCustomHaptics(): Promise<CustomHaptics | null> {
  if (custom !== null) return custom;
  if (customHapticsLoadPromise) return customHapticsLoadPromise;

  customHapticsLoadPromise = import('@/lib/haptics')
    .then((module) => {
      // Type-safe check for haptics module
      // The haptics module exports a HapticFeedback instance
      interface HapticsModuleExport {
        haptics?: {
          selection?: () => void;
          light?: () => void;
          medium?: () => void;
          success?: () => void;
        };
        default?: {
          haptics?: {
            selection?: () => void;
            light?: () => void;
            medium?: () => void;
            success?: () => void;
          };
        };
      }

      const mod = module as unknown as HapticsModuleExport;

      // Check if module has haptics export
      if (mod.haptics && typeof mod.haptics === 'object') {
        custom = { haptics: mod.haptics };
      } else if (mod.default?.haptics && typeof mod.default.haptics === 'object') {
        custom = { haptics: mod.default.haptics };
      }

      return custom;
    })
    .catch(() => {
      // Expected when custom haptics wrapper is not available
      return null;
    });

  return customHapticsLoadPromise;
}

export type HapticType = 'selection' | 'light' | 'medium' | 'success';

/** monotonic time for precise cooldowns */
const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

export class HapticManager {
  private lastTs = -Infinity;
  private cooldownMs: number;
  private reduced = isReduceMotionEnabled();

  constructor(cooldownMs = 250) {
    this.cooldownMs = cooldownMs;
  }

  updateReducedMotion(v?: boolean) {
    this.reduced = typeof v === 'boolean' ? v : isReduceMotionEnabled();
  }

  async triggerAsync(t: HapticType, bypassCooldown = false): Promise<boolean> {
    if (this.reduced) return false;

    const ts = now();
    if (!bypassCooldown && ts - this.lastTs < this.cooldownMs) return false;

    try {
      // Ensure haptics are loaded
      await Promise.all([loadCustomHaptics(), loadExpoHaptics()]);

      // Prefer custom wrapper if available, else Expo Haptics
      if (custom?.haptics?.[t] && typeof custom.haptics[t] === 'function') {
        custom.haptics[t]!();
      } else if (Haptics) {
        switch (t) {
          case 'selection':
            await Haptics.selectionAsync?.();
            break;
          case 'light':
            if (Haptics.ImpactFeedbackStyle) {
              await Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            }
            break;
          case 'medium':
            if (Haptics.ImpactFeedbackStyle) {
              await Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
            }
            break;
          case 'success':
            if (Haptics.NotificationFeedbackType) {
              await Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
            }
            break;
        }
      } else {
        // web/no-op
        return false;
      }

      this.lastTs = ts;
      return true;
    } catch {
      return false;
    }
  }

  trigger(t: HapticType, bypassCooldown = false): boolean {
    // Fire and forget for synchronous API compatibility
    this.triggerAsync(t, bypassCooldown).catch(() => {
      // Silent fail
    });

    // Return immediately if cooldown would prevent trigger
    if (this.reduced) return false;
    const ts = now();
    if (!bypassCooldown && ts - this.lastTs < this.cooldownMs) return false;

    // Update timestamp optimistically
    this.lastTs = ts;
    return true;
  }

  getTimeSinceLastTrigger(): number {
    return now() - this.lastTs;
  }

  isCooldownActive(): boolean {
    return this.getTimeSinceLastTrigger() < this.cooldownMs;
  }

  resetCooldown(): void {
    this.lastTs = -Infinity;
  }
}

let singleton: HapticManager | null = null;

export function getHapticManager(): HapticManager {
  return (singleton ??= new HapticManager());
}

export function triggerHaptic(type: HapticType, bypassCooldown = false): boolean {
  return getHapticManager().trigger(type, bypassCooldown);
}

/** React hook to auto-sync reduced motion with the singleton */
export function useHapticManager(): HapticManager {
  const reduced = useReducedMotion();
  const mgr = getHapticManager();

  useEffect(() => {
    mgr.updateReducedMotion(reduced);
  }, [reduced, mgr]);

  return mgr;
}
