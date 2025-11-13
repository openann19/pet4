/**
 * Link Preview Fade-Up Effect Hook (Enhanced)
 *
 * Creates a premium link preview animation with:
 * - Skeleton shimmer with gradient sweep (600ms)
 * - Content crossfade with fade-up (180ms)
 * - Adaptive animation based on device refresh rate
 * - Telemetry tracking
 * - Reduced motion → instant reveal
 *
 * Location: apps/web/src/effects/chat/media/use-link-preview-fade.ts
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from '@petspark/motion';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { logEffectStart, logEffectEnd } from '../core/telemetry';
import { createLogger } from '@/lib/logger';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

const logger = createLogger('link-preview-fade');

/**
 * Link preview fade effect options
 */
export interface UseLinkPreviewFadeOptions {
  enabled?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
}

/**
 * Link preview fade effect return type
 */
export interface UseLinkPreviewFadeReturn {
  skeletonOpacity: SharedValue<number>;
  contentOpacity: SharedValue<number>;
  skeletonTranslateY: SharedValue<number>;
  contentTranslateY: SharedValue<number>;
  shimmerPosition: SharedValue<number>;
  skeletonAnimatedStyle: AnimatedStyle;
  contentAnimatedStyle: AnimatedStyle;
  shimmerAnimatedStyle: AnimatedStyle;
}

const DEFAULT_ENABLED = true;
const SKELETON_DURATION = 600; // ms
const CONTENT_DURATION = 180; // ms
const SHIMMER_DURATION = 1200; // ms

/**
 * Hook to create link preview fade-up effect with skeleton shimmer
 *
 * @example
 * ```tsx
 * const {
 *   skeletonAnimatedStyle,
 *   contentAnimatedStyle,
 *   shimmerAnimatedStyle
 * } = useLinkPreviewFade({
 *   isLoading: true,
 *   isLoaded: false
 * })
 *
 * <Animated.View style={skeletonAnimatedStyle}>
 *   <Animated.View style={shimmerAnimatedStyle} />
 * </Animated.View>
 * <Animated.View style={contentAnimatedStyle}>
 *   {content}
 * </Animated.View>
 * ```
 */

export function useLinkPreviewFade(
  options: UseLinkPreviewFadeOptions = {}
): UseLinkPreviewFadeReturn {
  const { enabled = DEFAULT_ENABLED, isLoading = true, isLoaded = false } = options;

  const reducedMotion = useReducedMotionSV();
  const { scaleDuration } = useDeviceRefreshRate();
  const { visual, animation } = useUIConfig();
  const skeletonOpacity = useSharedValue(isLoading ? 1 : 0);
  const contentOpacity = useSharedValue(isLoaded ? 1 : 0);
  const skeletonTranslateY = useSharedValue(0);
  const contentTranslateY = useSharedValue(10);
  const shimmerPosition = useSharedValue(-100);
  const effectIdRef = useRef<string | null>(null);

  const startAnimation = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Check if effects are enabled in UI mode
    if (!visual.enableShimmer) {
      logger.debug('Link preview shimmer disabled by UI mode');
    }

    const isReducedMotion = reducedMotion.value;
    const skeletonDuration = getReducedMotionDuration(
      scaleDuration(SKELETON_DURATION),
      isReducedMotion
    );
    const contentDuration = getReducedMotionDuration(
      scaleDuration(CONTENT_DURATION),
      isReducedMotion
    );
    const shimmerDuration = getReducedMotionDuration(
      scaleDuration(SHIMMER_DURATION),
      isReducedMotion
    );

    if (isLoading) {
      // Log effect start
      const effectId = logEffectStart('link-preview', {
        phase: 'loading',
        reducedMotion: isReducedMotion,
      });
      effectIdRef.current = effectId;

      // Show skeleton with shimmer
      if (isReducedMotion) {
        skeletonOpacity.value = 1;
        skeletonTranslateY.value = 0;
        shimmerPosition.value = 0;
      } else {
        skeletonOpacity.value = withTiming(1, {
          duration: skeletonDuration,
          easing: Easing.out(Easing.ease),
        });
        skeletonTranslateY.value = withTiming(0, {
          duration: skeletonDuration,
          easing: Easing.out(Easing.ease),
        });

        // Shimmer animation (sweeping gradient) - only if shimmer enabled
        if (visual.enableShimmer) {
          shimmerPosition.value = withRepeat(
            withSequence(
              withTiming(100, {
                duration: shimmerDuration,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(-100, { duration: 0 })
            ),
            -1,
            false
          );
        }
      }
      contentOpacity.value = 0;

      logger.info('Link preview loading started', { reducedMotion: isReducedMotion });
    } else if (isLoaded) {
      // Crossfade to content
      if (isReducedMotion) {
        skeletonOpacity.value = 0;
        contentOpacity.value = 1;
        contentTranslateY.value = 0;
        shimmerPosition.value = 0;
      } else {
        // Fade out skeleton
        skeletonOpacity.value = withTiming(0, {
          duration: skeletonDuration * 0.3,
          easing: Easing.in(Easing.ease),
        });

        // Stop shimmer
        shimmerPosition.value = withTiming(0, {
          duration: contentDuration,
          easing: Easing.linear,
        });

        // Fade in content with slide up
        contentOpacity.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, {
            duration: contentDuration,
            easing: Easing.out(Easing.ease),
          })
        );

        contentTranslateY.value = withTiming(0, {
          duration: contentDuration,
          easing: Easing.out(Easing.ease),
        });
      }

      // Log effect end
      if (effectIdRef.current) {
        logEffectEnd(effectIdRef.current, {
          durationMs: contentDuration,
          success: true,
        });
        effectIdRef.current = null;
      }

      logger.info('Link preview loaded', { reducedMotion: isReducedMotion });
    }
  }, [
    enabled,
    isLoading,
    isLoaded,
    reducedMotion,
    scaleDuration,
    visual,
    animation,
    skeletonOpacity,
    contentOpacity,
    skeletonTranslateY,
    contentTranslateY,
    shimmerPosition,
  ]);

  useEffect(() => {
    startAnimation();

    return () => {
      // Cleanup
      if (effectIdRef.current) {
        logEffectEnd(effectIdRef.current, {
          durationMs: 0,
          success: false,
        });
        effectIdRef.current = null;
      }
    };
  }, [startAnimation]);

  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skeletonOpacity.value,
      transform: [{ translateY: skeletonTranslateY.value }],
    };
  }) as AnimatedStyle;

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateY: contentTranslateY.value }],
    };
  }) as AnimatedStyle;

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${shimmerPosition.value}%` }],
      opacity: skeletonOpacity.value > 0 ? 1 : 0,
    };
  }) as AnimatedStyle;

  return {
    skeletonOpacity,
    contentOpacity,
    skeletonTranslateY,
    contentTranslateY,
    shimmerPosition,
    skeletonAnimatedStyle,
    contentAnimatedStyle,
    shimmerAnimatedStyle,
  };
}
