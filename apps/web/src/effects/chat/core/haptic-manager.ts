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
  haptics: {
    selection: () => void;
    light: () => void;
    medium: () => void;
    heavy: () => void;
    success: () => void;
    warning: () => void;
    error: () => void;
    impact: (type: 'light' | 'medium' | 'heavy') => void;
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
      // The haptics module exports a named `haptics` export
      if (module.haptics && typeof module.haptics === 'object') {
        custom = { haptics: module.haptics };
      }

      return custom;
    })
    .catch(() => {
      // Expected when custom haptics wrapper is not available
      return null;
    });

  return customHapticsLoadPromise;
}

export type HapticType = 'selection' | 'light' | 'medium' | 'strong' | 'success' | 'warning' | 'error';

export type HapticContext =
  | 'send'
  | 'receive'
  | 'reaction'
  | 'reply'
  | 'delete'
  | 'swipe'
  | 'longPress'
  | 'tap'
  | 'success'
  | 'error'
  | 'threshold'
  | 'statusChange';

export interface HapticPattern {
  type: HapticType;
  delay?: number;
  repeat?: number;
  interval?: number;
}

/** monotonic time for precise cooldowns */
const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

/**
 * Context-aware haptic patterns
 */
const CONTEXT_PATTERNS: Record<HapticContext, HapticPattern> = {
  send: { type: 'selection' },
  receive: { type: 'light' },
  reaction: { type: 'light' },
  reply: { type: 'light' },
  delete: { type: 'strong' },
  swipe: { type: 'light' },
  longPress: { type: 'medium' },
  tap: { type: 'selection' },
  success: { type: 'success' },
  error: { type: 'error' },
  threshold: { type: 'light' },
  statusChange: { type: 'selection' },
};

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
      if (custom?.haptics) {
        switch (t) {
          case 'selection':
            custom.haptics.selection();
            break;
          case 'light':
            custom.haptics.impact('light');
            break;
          case 'medium':
            custom.haptics.impact('medium');
            break;
          case 'strong':
            custom.haptics.impact('heavy');
            break;
          case 'success':
            custom.haptics.success();
            break;
          case 'warning':
            custom.haptics.warning();
            break;
          case 'error':
            custom.haptics.error();
            break;
        }
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
          case 'strong':
            if (Haptics.ImpactFeedbackStyle) {
              await Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
            }
            break;
          case 'warning':
            if (Haptics.NotificationFeedbackType) {
              await Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Warning);
            }
            break;
          case 'error':
            if (Haptics.NotificationFeedbackType) {
              await Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
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

  /**
   * Trigger haptic by context (context-aware pattern)
   */
  async triggerByContext(context: HapticContext, bypassCooldown = false): Promise<boolean> {
    const pattern = CONTEXT_PATTERNS[context];
    if (!pattern) {
      return false;
    }

    return this.triggerAsync(pattern.type, bypassCooldown);
  }

  /**
   * Trigger haptic pattern (multiple haptics with delays)
   */
  async triggerPattern(pattern: HapticPattern, bypassCooldown = false): Promise<boolean> {
    if (this.reduced) return false;

    const ts = now();
    if (!bypassCooldown && ts - this.lastTs < this.cooldownMs) return false;

    try {
      const repeat = pattern.repeat ?? 1;
      const interval = pattern.interval ?? 50;

      for (let i = 0; i < repeat; i++) {
        if (i > 0 && interval > 0) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        await this.triggerAsync(pattern.type, i === 0 ? bypassCooldown : true);
      }

      this.lastTs = now();
      return true;
    } catch {
      return false;
    }
  }
}

let singleton: HapticManager | null = null;

export function getHapticManager(): HapticManager {
  return (singleton ??= new HapticManager());
}

export function triggerHaptic(type: HapticType, bypassCooldown = false): boolean {
  return getHapticManager().trigger(type, bypassCooldown);
}

/**
 * Trigger haptic by context (context-aware)
 */
export function triggerHapticByContext(context: HapticContext, bypassCooldown = false): boolean {
  const mgr = getHapticManager();
  mgr.triggerByContext(context, bypassCooldown).catch(() => {
    // Silent fail
  });
  return true;
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
