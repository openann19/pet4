/**
 * Pull-to-refresh hook with gesture, progress, and reduced-motion support
 * Location: src/hooks/use-pull-to-refresh.ts
 */

import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { cancelAnimation, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming, type WithSpringConfig } from '@petspark/motion'
import { createLogger } from '../utils/logger'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('usePullToRefresh')

export interface UsePullToRefreshOptions {
  /** Distance at which a refresh triggers (px). Default 80. */
  threshold?: number
  /** Maximum pull distance (px). Default 120. */
  maxPull?: number
  /** Drag resistance factor (>1 means "harder to pull"). Default 2.5. */
  resistance?: number
  /** Spring config for settle animations. */
  springConfig?: WithSpringConfig
  /** Enable haptics (default true). */
  haptics?: boolean
  /** Haptic feedback style (default Light). */
  hapticStyle?: Haptics.ImpactFeedbackStyle
  /** Callback for pull progress [0..1]. */
  onPullProgress?: (progress: number) => void
}

export interface UsePullToRefreshReturn {
  /** React state mirror for UI logic. */
  isRefreshing: boolean
  /** Programmatic trigger for refresh (plays animation). */
  refresh: () => Promise<void>
  /** Reanimated shared translateY for custom use. */
  translateY: ReturnType<typeof useSharedValue<number>>
  /** Normalized progress [0..1] (shared). */
  progress: ReturnType<typeof useSharedValue<number>>
  /** Gesture to pass to <GestureDetector gesture={...} /> */
  gesture: ReturnType<typeof Gesture.Pan>
  /** Animated style for the pullable container (transform translateY). */
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

const DEFAULT_SPRING: WithSpringConfig = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  opts: UsePullToRefreshOptions = {}
): UsePullToRefreshReturn {
  const {
    threshold = 80,
    maxPull = 120,
    resistance = 2.5,
    springConfig = DEFAULT_SPRING,
    haptics = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    onPullProgress,
  } = opts

  const [isRefreshing, setIsRefreshing] = useState(false)

  // Shared values used on the UI thread
  const translateY = useSharedValue(0)
  const progress = useSharedValue(0)
  const isRefreshingSV = useSharedValue(false)
  const didHapticSV = useSharedValue(false)
  const reducedMotionSV = useSharedValue(false)

  // Keep latest onRefresh ref for runOnJS calls
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  // Reduced motion flag (JS -> shared)
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) reducedMotionSV.value = !!enabled
      })
      .catch(() => {
        // Ignore; default false
      })

    const removeListener = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged' as 'change',
      (enabled: boolean) => {
        reducedMotionSV.value = !!enabled
      }
    ) as (() => void) | { remove: () => void } | undefined

    return () => {
      mounted = false
      if (isTruthy(removeListener)) {
        if (typeof removeListener === 'function') {
          removeListener()
        } else if ('remove' in removeListener) {
          removeListener.remove()
        }
      }
    }
  }, [reducedMotionSV])

  // Progress callback to JS world (throttled by UI thread)
  const onPullProgressRef = useRef(onPullProgress)
  useEffect(() => {
    onPullProgressRef.current = onPullProgress
  }, [onPullProgress])

  const animateTo = useCallback(
    (y: number) => {
      // Respect reduced motion: shorter timing instead of spring
      if (isTruthy(reducedMotionSV.value)) {
        translateY.value = withTiming(y, { duration: 120 })
      } else {
        translateY.value = withSpring(y, springConfig)
      }
    },
    [springConfig, translateY, reducedMotionSV]
  )

  const startRefreshJS = useCallback(async () => {
    setIsRefreshing(true)
    isRefreshingSV.value = true
    try {
      await onRefreshRef.current()
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      logger.error('Pull to refresh failed', err)
    } finally {
      // Reset state and settle back to 0
      animateTo(0)
      didHapticSV.value = false
      setIsRefreshing(false)
      isRefreshingSV.value = false
    }
  }, [animateTo, didHapticSV, isRefreshingSV])

  // Shared value to track last progress for throttling
  const lastProgressSV = useSharedValue(0)

  // Derived value to keep progress in sync
  useDerivedValue(() => {
    const p = Math.min(1, Math.max(0, translateY.value / threshold))
    progress.value = p
    if (isTruthy(onPullProgressRef.current)) {
      // Bounce to JS sparingly when it changes perceptibly (>2% change)
      const diff = Math.abs(p - lastProgressSV.value)
      if (p === 0 || p === 1 || diff > 0.02) {
        lastProgressSV.value = p
        runOnJS(onPullProgressRef.current)(p)
      }
    }
  }, [threshold, translateY, progress, lastProgressSV])

  // Pan gesture for pull-down
  const gesture = useMemo(() => {
    return Gesture.Pan()
      .onBegin(() => {
        // Cancel any ongoing settle animation so user can take control
        cancelAnimation(translateY)
        didHapticSV.value = false
      })
      .onUpdate((e: { translationY: number }) => {
        if (isRefreshingSV.value) return

        // Only consider downward drag; apply resistance
        const raw = Math.max(0, e.translationY)
        const resisted = Math.min(maxPull, raw / resistance)

        translateY.value = resisted

        // One-shot haptic on threshold cross
        if (
          haptics &&
          !reducedMotionSV.value &&
          !didHapticSV.value &&
          translateY.value >= threshold
        ) {
          didHapticSV.value = true
          const triggerHaptic = (): void => {
            Haptics.impactAsync(hapticStyle).catch(() => {
              // Ignore haptic errors
            })
          }
          runOnJS(triggerHaptic)()
        }
      })
      .onEnd(() => {
        if (isTruthy(isRefreshingSV.value)) return
        if (translateY.value >= threshold) {
          // Snap to threshold and kick off refresh
          animateTo(threshold)
          runOnJS(startRefreshJS)()
        } else {
          // Settle back
          animateTo(0)
        }
      })
  }, [
    animateTo,
    haptics,
    hapticStyle,
    isRefreshingSV,
    didHapticSV,
    maxPull,
    resistance,
    threshold,
    translateY,
    reducedMotionSV,
    startRefreshJS,
  ])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    }
  })

  const refresh = useCallback(async () => {
    if (isRefreshing || isRefreshingSV.value) return
    // Programmatic: play pull animation to threshold, haptic (if allowed), then run refresh
    if (haptics && !reducedMotionSV.value && Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(hapticStyle)
      } catch {
        // Ignore haptic errors
      }
    }
    animateTo(threshold)
    setIsRefreshing(true)
    isRefreshingSV.value = true
    try {
      await onRefreshRef.current()
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      logger.error('Pull to refresh failed', err)
    } finally {
      animateTo(0)
      didHapticSV.value = false
      setIsRefreshing(false)
      isRefreshingSV.value = false
    }
  }, [
    animateTo,
    haptics,
    hapticStyle,
    isRefreshing,
    isRefreshingSV,
    reducedMotionSV,
    threshold,
    didHapticSV,
  ])

  return {
    isRefreshing,
    refresh,
    translateY,
    progress,
    gesture,
    animatedStyle,
  }
}
