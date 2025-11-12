/**
 * Reduced Motion Detection (Web + RN) — SSR-safe, worklet-friendly
 */

import { useEffect, useState } from 'react';

import { useSharedValue, type SharedValue } from 'react-native-reanimated';

// Type definitions for optional React Native AccessibilityInfo
interface AccessibilityInfoType {
  isReduceMotionEnabled?: () => Promise<boolean>;
  addEventListener?: (
    event: 'reduceMotionChanged',
    handler: (enabled: boolean) => void
  ) => {
    remove: () => void;
  };
}

// Web version - React Native AccessibilityInfo is not available
// Web uses matchMedia API instead
const AccessibilityInfo: AccessibilityInfoType | null = null;

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export function isReduceMotionEnabled(): boolean {
  // RN path: prefer AccessibilityInfo snapshot if available (non-blocking)
  if (isTruthy(AccessibilityInfo?.isReduceMotionEnabled)) {
    // We can't await here (sync API); return best guess (false) and let hooks update
    // Callers needing reactive updates should use hooks below.
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;

  try {
    return window.matchMedia(MEDIA_QUERY).matches;
  } catch {
    return false;
  }
}

/** Reactive hook (Web + RN) that updates on preference changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => isReduceMotionEnabled());

  useEffect(() => {
    let mounted = true;

    // RN listener (preferred on native)
    if (AccessibilityInfo?.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((v: boolean) => mounted && setReduced(!!v))
        .catch(() => {});
      const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
        if (mounted) setReduced(!!v);
      });

      return () => {
        mounted = false;
        sub?.remove?.();
      };
    }

    // Web listener
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia(MEDIA_QUERY);

      const handler = (e: MediaQueryListEvent) => {
        if (mounted) setReduced(!!e.matches);
      };

      try {
        if (mq.addEventListener) {
          mq.addEventListener('change', handler);
        } else if (mq.addListener) {
          mq.addListener(handler);
        }
        setReduced(mq.matches);

        return () => {
          mounted = false;
          if (mq.removeEventListener) {
            mq.removeEventListener('change', handler);
          } else if (mq.removeListener) {
            mq.removeListener(handler);
          }
        };
      } catch {
        /* noop */
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  return reduced;
}

/** SharedValue version for use in worklets. */
export function useReducedMotionSV(): SharedValue<boolean> {
  const sv = useSharedValue<boolean>(isReduceMotionEnabled());
  const reduced = useReducedMotion();

  useEffect(() => {
    sv.value = reduced;
  }, [reduced, sv]);

  return sv;
}

/** Clamp duration for reduced motion (≤120ms), else pass through. */
export function getReducedMotionDuration(baseMs: number, reduced: boolean): number {
  return reduced ? Math.min(120, baseMs) : baseMs;
}

/** Multiplier helper (0 for instant when reduced). */
export function getReducedMotionMultiplier(reduced: boolean): number {
  return reduced ? 0 : 1;
}
