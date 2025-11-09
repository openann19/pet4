/**
 * Reduced Motion Detection (Web + RN) — SSR-safe, worklet-friendly
 */

import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

import { useSharedValue, type SharedValue } from 'react-native-reanimated'
import { importOptional } from '@/utils/optional-imports'

// Optional RN import (lazy/try-catch for web)
interface ReactNativeAccessibilityInfo {
  isReduceMotionEnabled?: () => Promise<boolean>
  addEventListener?: (
    event: string,
    handler: (enabled: boolean) => void
  ) => { remove: () => void } | null
}

interface ReactNativeModule {
  AccessibilityInfo?: ReactNativeAccessibilityInfo
}

function isReactNativeModule(module: unknown): module is ReactNativeModule {
  return typeof module === 'object' && module !== null && 'AccessibilityInfo' in module
}

let AccessibilityInfo: ReactNativeAccessibilityInfo | null = null
let accessibilityInfoLoadPromise: Promise<ReactNativeAccessibilityInfo | null> | null = null

async function loadAccessibilityInfo(): Promise<ReactNativeAccessibilityInfo | null> {
  if (AccessibilityInfo !== null) return AccessibilityInfo
  if (accessibilityInfoLoadPromise) return accessibilityInfoLoadPromise

  accessibilityInfoLoadPromise = importOptional<ReactNativeModule>(
    'react-native',
    isReactNativeModule
  ).then(module => module?.AccessibilityInfo ?? null)

  AccessibilityInfo = await accessibilityInfoLoadPromise
  return AccessibilityInfo
}

// Initialize on module load (non-blocking)
loadAccessibilityInfo().catch(() => {
  // Expected on web or when react-native is not available
})

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

// Type guard for legacy MediaQueryList API
interface LegacyMediaQueryList {
  addListener: (handler: (e: MediaQueryListEvent) => void) => void
  removeListener: (handler: (e: MediaQueryListEvent) => void) => void
  matches: boolean
}

function isLegacyMediaQueryList(
  mq: MediaQueryList | LegacyMediaQueryList
): mq is LegacyMediaQueryList {
  return (
    typeof mq === 'object' &&
    mq !== null &&
    'addListener' in mq &&
    typeof (mq as LegacyMediaQueryList).addListener === 'function' &&
    'removeListener' in mq &&
    typeof (mq as LegacyMediaQueryList).removeListener === 'function'
  )
}

export function isReduceMotionEnabled(): boolean {
  // RN path: prefer AccessibilityInfo snapshot if available (non-blocking)
  if (AccessibilityInfo?.isReduceMotionEnabled) {
    // We can't await here (sync API); return best guess (false) and let hooks update
    // Callers needing reactive updates should use hooks below.
  }

  // Only check window on web platform
  if (Platform.OS !== 'web') return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false

  try {
    return window.matchMedia(MEDIA_QUERY).matches
  } catch {
    return false
  }
}

/** Reactive hook (Web + RN) that updates on preference changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => isReduceMotionEnabled())

  useEffect(() => {
    let mounted = true
    let subscription: { remove: () => void } | null = null
    let webCleanup: (() => void) | null = null

    // Load AccessibilityInfo and set up RN listener (preferred on native)
    loadAccessibilityInfo()
      .then(info => {
        if (!mounted || !info) {
          // Fall through to web listener if RN not available
          return
        }

        if (info.isReduceMotionEnabled) {
          info
            .isReduceMotionEnabled()
            .then((v: boolean) => {
              if (mounted) setReduced(!!v)
            })
            .catch(() => {
              // Silent fail
            })

          subscription =
            info.addEventListener?.('reduceMotionChanged', (v: boolean) => {
              if (mounted) setReduced(!!v)
            }) ?? null
        }
      })
      .catch(() => {
        // Expected on web or when react-native is not available
        // Fall through to web listener
      })

    // Web listener (always set up as fallback or primary on web)
    if (Platform.OS === 'web') {
      const win = typeof window !== 'undefined' ? window : null
      if (win && typeof win.matchMedia === 'function') {
        try {
          const mq = win.matchMedia(MEDIA_QUERY)
          if (mq) {
            const handler = (e: MediaQueryListEvent | Event): void => {
              const mediaEvent = e as MediaQueryListEvent
              if (mounted && 'matches' in mediaEvent) {
                setReduced(!!mediaEvent.matches)
              }
            }

            if (typeof mq.addEventListener === 'function') {
              mq.addEventListener('change', handler as EventListener)
              webCleanup = (): void => {
                if (mq && typeof mq.removeEventListener === 'function') {
                  mq.removeEventListener('change', handler as EventListener)
                }
              }
            } else if (isLegacyMediaQueryList(mq)) {
              // Legacy API support
              const legacyHandler = (e: MediaQueryListEvent): void => {
                if (mounted) {
                  setReduced(!!e.matches)
                }
              }
              mq.addListener(legacyHandler)
              webCleanup = (): void => {
                if (mounted) {
                  mq.removeListener(legacyHandler)
                }
              }
            }
            setReduced(mq.matches)
          }
        } catch {
          // Expected when matchMedia API is not available
        }
      }
    }

    return () => {
      mounted = false
      subscription?.remove?.()
      webCleanup?.()
    }
  }, [])

  return reduced
}

/** SharedValue version for use in worklets. */
export function useReducedMotionSV(): SharedValue<boolean> {
  const sv = useSharedValue<boolean>(isReduceMotionEnabled())
  const reduced = useReducedMotion()

  useEffect(() => {
    sv.value = reduced
  }, [reduced, sv])

  return sv
}

/** Clamp duration for reduced motion (≤120ms), else pass through. */
export function getReducedMotionDuration(baseMs: number, reduced: boolean): number {
  return reduced ? Math.min(120, baseMs) : baseMs
}

/** Multiplier helper (0 for instant when reduced). */
export function getReducedMotionMultiplier(reduced: boolean): number {
  return reduced ? 0 : 1
}
