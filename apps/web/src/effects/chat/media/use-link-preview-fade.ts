/**
 * Link Preview Fade-Up Effect Hook
 * 
 * Creates a premium link preview animation with:
 * - Skeleton shimmer (600ms)
 * - Content crossfade (180ms)
 * - Reduced motion → instant reveal
 * 
 * Location: apps/web/src/effects/chat/media/use-link-preview-fade.ts
 */

import { useEffect } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { isTruthy, isDefined } from '@/core/guards';

/**
 * Link preview fade effect options
 */
export interface UseLinkPreviewFadeOptions {
  enabled?: boolean
  isLoading?: boolean
  isLoaded?: boolean
}

/**
 * Link preview fade effect return type
 */
export interface UseLinkPreviewFadeReturn {
  skeletonOpacity: SharedValue<number>
  contentOpacity: SharedValue<number>
  skeletonTranslateY: SharedValue<number>
  contentTranslateY: SharedValue<number>
  skeletonAnimatedStyle: AnimatedStyle
  contentAnimatedStyle: AnimatedStyle
}

const DEFAULT_ENABLED = true
const SKELETON_DURATION = 600 // ms
const CONTENT_DURATION = 180 // ms

export function useLinkPreviewFade(
  options: UseLinkPreviewFadeOptions = {}
): UseLinkPreviewFadeReturn {
  const {
    enabled = DEFAULT_ENABLED,
    isLoading = true,
    isLoaded = false,
  } = options

  const reducedMotion = useReducedMotionSV()
  const skeletonOpacity = useSharedValue(isLoading ? 1 : 0)
  const contentOpacity = useSharedValue(isLoaded ? 1 : 0)
  const skeletonTranslateY = useSharedValue(0)
  const contentTranslateY = useSharedValue(10)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const isReducedMotion = reducedMotion.value

    if (isTruthy(isLoading)) {
      // Show skeleton with shimmer
      if (isTruthy(isReducedMotion)) {
        skeletonOpacity.value = 1
        skeletonTranslateY.value = 0
      } else {
        skeletonOpacity.value = withTiming(1, {
          duration: getReducedMotionDuration(SKELETON_DURATION, false),
          easing: Easing.out(Easing.ease),
        })
        skeletonTranslateY.value = withTiming(0, {
          duration: getReducedMotionDuration(SKELETON_DURATION, false),
          easing: Easing.out(Easing.ease),
        })
      }
      contentOpacity.value = 0
    } else if (isTruthy(isLoaded)) {
      // Crossfade to content
      const skeletonDuration = getReducedMotionDuration(SKELETON_DURATION, isReducedMotion)
      const contentDuration = getReducedMotionDuration(CONTENT_DURATION, isReducedMotion)

      if (isTruthy(isReducedMotion)) {
        skeletonOpacity.value = 0
        contentOpacity.value = 1
        contentTranslateY.value = 0
      } else {
        // Fade out skeleton
        skeletonOpacity.value = withTiming(0, {
          duration: skeletonDuration * 0.3,
          easing: Easing.in(Easing.ease),
        })

        // Fade in content
        contentOpacity.value = withSequence(
          withTiming(0, {
            duration: 0,
            easing: Easing.linear,
          }),
          withTiming(1, {
            duration: contentDuration,
            easing: Easing.out(Easing.ease),
          })
        )

        contentTranslateY.value = withTiming(0, {
          duration: contentDuration,
          easing: Easing.out(Easing.ease),
        })
      }
    }
  }, [enabled, isLoading, isLoaded, reducedMotion, skeletonOpacity, contentOpacity, skeletonTranslateY, contentTranslateY])

  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skeletonOpacity.value,
      transform: [{ translateY: skeletonTranslateY.value }],
    }
  }) as AnimatedStyle

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateY: contentTranslateY.value }],
    }
  }) as AnimatedStyle

  return {
    skeletonOpacity,
    contentOpacity,
    skeletonTranslateY,
    contentTranslateY,
    skeletonAnimatedStyle,
    contentAnimatedStyle,
  }
}

