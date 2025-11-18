/**
 * Receive "Air-Cushion" Effect Hook
 *
 * Creates a premium receive animation with:
 * - Spring scale animation (0.98→1.0, stiffness 280, damping 20, 180-220ms)
 * - Soft drop shadow animation (0→4dp over 120ms)
 * - No haptic by default (respect quiet inbox), optional Light on mentions
 *
 * Location: apps/web/src/effects/chat/bubbles/use-receive-air-cushion.ts
 */

import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  type SharedValue,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { useReducedMotionSV, getReducedMotionDuration } from '../core/reduced-motion';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectStart, logEffectEnd } from '../core/telemetry';
import { randomRange } from '../core/seeded-rng';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@petspark/motion';

/**
 * Receive air-cushion effect options
 */
export interface UseReceiveAirCushionOptions {
  enabled?: boolean;
  isNew?: boolean;
  isMention?: boolean;
  onComplete?: () => void;
}

/**
 * Receive air-cushion effect return type
 */
export interface UseReceiveAirCushionReturn {
  scale: SharedValue<number>;
  shadowOpacity: SharedValue<number>;
  shadowRadius: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  trigger: () => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_IS_NEW = true;
const SCALE_DURATION_MIN = 180; // ms
const SCALE_DURATION_MAX = 220; // ms
const SHADOW_DURATION = 120; // ms
const SHADOW_MAX_RADIUS = 4; // px

export function useReceiveAirCushion(
  options: UseReceiveAirCushionOptions = {}
): UseReceiveAirCushionReturn {
  const {
    enabled = DEFAULT_ENABLED,
    isNew = DEFAULT_IS_NEW,
    isMention = false,
    onComplete,
  } = options;

  const reducedMotion = useReducedMotionSV();
  const { hz, scaleDuration } = useDeviceRefreshRate();
  const { visual, feedback, animation } = useUIConfig();
  const scale = useSharedValue(isNew && enabled ? 0.98 : 1.0);
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);

  const trigger = useCallback(() => {
    if (!enabled || !isNew) {
      return;
    }

    const isReducedMotion = reducedMotion.value;
    // Use adaptive duration scaling based on device refresh rate
    const baseScaleDuration = isReducedMotion
      ? getReducedMotionDuration(SCALE_DURATION_MIN, true)
      : SCALE_DURATION_MIN + randomRange(0, SCALE_DURATION_MAX - SCALE_DURATION_MIN);
    const scaleDurationAdapted = scaleDuration(baseScaleDuration);

    // Log effect start
    const effectId = logEffectStart('receive-air-cushion', {
      // reducedMotion option removed
      isMention,
    });

    // Scale animation (0.98 → 1.0) - use UI config spring physics if available
    if (isReducedMotion) {
      // Instant scale for reduced motion
      scale.value = withTiming(1.0, {
        duration: getReducedMotionDuration(SCALE_DURATION_MIN, true),
        easing: (t) => t, // linear
      });
    } else {
      // Use UI config spring physics or fallback to adaptive config
      const springConfig = animation.enableReanimated && animation.springPhysics
        ? {
            stiffness: animation.springPhysics.stiffness,
            damping: animation.springPhysics.damping,
            mass: animation.springPhysics.mass,
          }
        : adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120);
      scale.value = withSpring(1.0, springConfig);
    }

    // Shadow animation (0 → 4px) - only if shadows enabled
    if (visual.enableShadows) {
      // Use adaptive duration scaling for shadow animation
      const baseShadowDuration = getReducedMotionDuration(SHADOW_DURATION, reducedMotion.value > 0);
      const shadowDuration = scaleDuration(baseShadowDuration);

      shadowOpacity.value = withTiming(1.0, {
        duration: shadowDuration,
        easing: (t) => t, // linear
      });

      shadowRadius.value = withTiming(SHADOW_MAX_RADIUS, {
        duration: shadowDuration,
        easing: (t) => t, // linear
      });
    }

    // Haptic feedback (only on mentions and if haptics enabled)
    if (isMention && feedback.haptics) {
      triggerHaptic('light');
    }

    // Call onComplete
    if (isTruthy(onComplete)) {
      setTimeout(() => {
        onComplete();
      }, scaleDurationAdapted);
    }

    // Log effect end
    setTimeout(() => {
      logEffectEnd(effectId, {
        durationMs: scaleDurationAdapted,
        success: true,
      });
    }, scaleDurationAdapted);
  }, [enabled, isNew, isMention, reducedMotion, hz, scaleDuration, visual, feedback, animation, scale, shadowOpacity, shadowRadius, onComplete]);

  useEffect(() => {
    if (enabled && isNew) {
      trigger();
    }
  }, [enabled, isNew, trigger]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      boxShadow: `0 ${shadowRadius.value}px ${shadowRadius.value * 2}px rgba(0, 0, 0, ${shadowOpacity.value * 0.2})`,
    };
  }) as AnimatedStyle;

  return {
    scale,
    shadowOpacity,
    shadowRadius,
    animatedStyle,
    trigger,
  };
}
