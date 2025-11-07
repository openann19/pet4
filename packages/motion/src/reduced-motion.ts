/**
 * Reduced Motion Detection (Web + RN) — SSR-safe, worklet-friendly
 * 
 * Unified reduced motion hooks for both web and mobile platforms.
 * Respects system accessibility settings and provides SharedValue for worklets.
 */

import { useEffect, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { isTruthy, isDefined } from '@/core/guards';

// React Native AccessibilityInfo is loaded lazily to avoid bundling issues on web
type RNAccessibilityInfo = typeof import('react-native').AccessibilityInfo;
let RN_ACC: RNAccessibilityInfo | null = null;

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Synchronous check for reduced motion preference (non-reactive)
 * Returns best guess - use hooks for reactive updates
 */
export function isReduceMotionEnabled(): boolean {
  // RN path: prefer AccessibilityInfo snapshot if available (non-blocking)
  // Note: We can't await here (sync API), so return false and let hooks update
  
  // Web path
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia(MEDIA_QUERY).matches;
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Reactive hook (Web + RN) that updates on preference changes.
 * 
 * @returns boolean - true if reduced motion is enabled
 * 
 * @example
 * ```typescript
 * const reducedMotion = useReducedMotion()
 * const duration = reducedMotion ? 120 : 300
 * ```
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => isReduceMotionEnabled());

  useEffect(() => {
    let mounted = true;

    // Try to attach RN listener if available (native only)
    // Dynamically import to avoid hard dependency on web
    void import('react-native')
      .then((rn: typeof import('react-native')) => {
        RN_ACC = rn.AccessibilityInfo;
        if (isTruthy(RN_ACC?.isReduceMotionEnabled)) {
          RN_ACC.isReduceMotionEnabled()
            .then((v: boolean) => { if (isTruthy(mounted)) setReduced(v); })
            .catch(() => { /* ignore */ });

          const sub = RN_ACC.addEventListener?.('reduceMotionChanged', (v2: boolean) => {
            if (isTruthy(mounted)) setReduced(v2);
          });

          return () => {
            mounted = false;
            sub?.remove?.();
          };
        }
        return undefined;
      })
      .catch(() => { /* ignore (web) */ });

    // Web listener
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia(MEDIA_QUERY);

      const handler = (e: MediaQueryListEvent) => {
        if (isTruthy(mounted)) setReduced(e.matches);
      };

      try {
        if (typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', handler);
        }

        return () => {
          mounted = false;
          if (typeof mq.removeEventListener === 'function') {
            mq.removeEventListener('change', handler);
          }
        };
      } catch {
        // Silent fail
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  return reduced;
}

/**
 * SharedValue version for use in worklets.
 * Updates reactively when preference changes and can be used in animated styles.
 * 
 * @returns SharedValue<boolean> - true if reduced motion is enabled
 * 
 * @example
 * ```typescript
 * const reducedMotion = useReducedMotionSV()
 * 
 * const animatedStyle = useAnimatedStyle(() => {
 *   if (reducedMotion.value) {
 *     return { opacity: 1 } // Instant, no animation
 *   }
 *   return { opacity: withSpring(1) }
 * })
 * ```
 */
export function useReducedMotionSV(): SharedValue<boolean> {
  const sv = useSharedValue<boolean>(isReduceMotionEnabled());
  const reduced = useReducedMotion();

  useEffect(() => {
    sv.value = reduced;
  }, [reduced, sv]);

  return sv;
}

/**
 * Clamp duration for reduced motion (≤120ms), else pass through.
 * 
 * @param baseMs - Base duration in milliseconds
 * @param reduced - Whether reduced motion is enabled (optional, will check if not provided)
 * @returns Clamped duration (≤120ms if reduced, else baseMs)
 * 
 * @example
 * ```typescript
 * const duration = getReducedMotionDuration(300, useReducedMotion()) // Returns 120 if reduced, 300 otherwise
 * ```
 */
export function getReducedMotionDuration(baseMs: number, reduced?: boolean): number {
  if (reduced === undefined) {
    reduced = isReduceMotionEnabled();
  }
  return reduced ? Math.min(120, baseMs) : baseMs;
}

/**
 * Multiplier helper (0 for instant when reduced, 1 otherwise).
 * Useful for scaling animation values.
 * 
 * @param reduced - Whether reduced motion is enabled (optional, will check if not provided)
 * @returns 0 if reduced, 1 otherwise
 */
export function getReducedMotionMultiplier(reduced?: boolean): number {
  if (reduced === undefined) {
    reduced = isReduceMotionEnabled();
  }
  return reduced ? 0 : 1;
}
