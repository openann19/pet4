/**
 * Presence "Aurora Ring" Effect Hook (Enhanced)
 *
 * Creates a premium perimeter glow around avatar for active users:
 * - Animated ring with pulsing opacity and scale
 * - Gradient color transitions based on status
 * - Subtle rotation animation for "aurora" effect
 * - Adaptive animation based on device refresh rate
 * - Reduced motion → static ring with glow
 * - Telemetry tracking for performance monitoring
 *
 * Location: apps/web/src/effects/chat/presence/use-aurora-ring.ts
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
import { useReducedMotionSV, getReducedMotionDuration } from '../core/reduced-motion';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { logEffectStart, logEffectEnd } from '../core/telemetry';
import { createLogger } from '@/lib/logger';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

const logger = createLogger('aurora-ring');

/**
 * Presence status type
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Presence aurora ring effect options
 */
export interface UseAuroraRingOptions {
  enabled?: boolean;
  status?: PresenceStatus;
  size?: number;
}

/**
 * Presence aurora ring effect return type
 */
export interface UseAuroraRingReturn {
  ringOpacity: SharedValue<number>;
  ringScale: SharedValue<number>;
  ringRotation: SharedValue<number>;
  glowIntensity: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  isActive: boolean;
}

const DEFAULT_ENABLED = true;
const DEFAULT_STATUS: PresenceStatus = 'online';
const DEFAULT_SIZE = 40; // px
const PULSE_DURATION = 1500; // ms
const ROTATION_DURATION = 8000; // ms (slow rotation for aurora effect)

/**
 * Status colors with gradients
 */
const STATUS_COLORS: Record<PresenceStatus, { primary: string; secondary: string }> = {
  online: { primary: '#10B981', secondary: '#059669' }, // green gradient
  away: { primary: '#F59E0B', secondary: '#D97706' }, // amber gradient
  busy: { primary: '#EF4444', secondary: '#DC2626' }, // red gradient
  offline: { primary: '#6B7280', secondary: '#4B5563' }, // gray gradient
};

/**
 * Hook to create aurora ring presence indicator
 *
 * @example
 * ```tsx
 * const { animatedStyle, isActive } = useAuroraRing({
 *   enabled: true,
 *   status: 'online',
 *   size: 48
 * })
 *
 * <Animated.View style={[styles.ring, animatedStyle]} />
 * ```
 */

export function useAuroraRing(options: UseAuroraRingOptions = {}): UseAuroraRingReturn {
  const { enabled = DEFAULT_ENABLED, status = DEFAULT_STATUS, size = DEFAULT_SIZE } = options;

  const reducedMotion = useReducedMotionSV();
  const { scaleDuration } = useDeviceRefreshRate();
  const { visual, theme, animation } = useUIConfig();
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringRotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const effectIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (!enabled || status === 'offline') {
      ringOpacity.value = 0;
      glowIntensity.value = 0;
      isActiveRef.current = false;
      return;
    }

    // Check if effects are enabled in UI mode
    if (!visual.enableGlow || !theme.avatarGlow) {
      logger.debug('Aurora ring disabled by UI mode');
      return;
    }

    isActiveRef.current = true;

    const isReducedMotion = reducedMotion.value;
    const pulseDuration = getReducedMotionDuration(
      scaleDuration(PULSE_DURATION),
      isReducedMotion
    );
    const rotationDuration = getReducedMotionDuration(
      scaleDuration(ROTATION_DURATION),
      isReducedMotion
    );

    // Log effect start
    const effectId = logEffectStart('presence-aurora', {
      status,
      size,
      reducedMotion: isReducedMotion,
    });
    effectIdRef.current = effectId;

    if (isTruthy(isReducedMotion)) {
      // Static ring for reduced motion
      ringOpacity.value = withTiming(0.6, { duration: 200 });
      ringScale.value = withTiming(1.1, { duration: 200 });
      glowIntensity.value = withTiming(0.8, { duration: 200 });
      ringRotation.value = 0;
    } else {
      // Pulsing animation
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, {
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.4, {
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1.05, {
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      // Glow intensity pulsing
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1.0, {
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.6, {
            duration: pulseDuration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      // Slow rotation for aurora effect
      ringRotation.value = withRepeat(
        withTiming(360, {
          duration: rotationDuration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }

    logger.info('Aurora ring started', { status, size, reducedMotion: isReducedMotion });
  }, [enabled, status, size, reducedMotion, scaleDuration, visual, theme, animation, ringOpacity, ringScale, ringRotation, glowIntensity]);

  useEffect(() => {
    startAnimation();

    return () => {
      // Log effect end on cleanup
      if (effectIdRef.current) {
        logEffectEnd(effectIdRef.current, {
          durationMs: Date.now() - (effectIdRef.current ? parseInt(effectIdRef.current.split('-')[1] ?? '0') : 0),
          success: true,
        });
        effectIdRef.current = null;
      }
      isActiveRef.current = false;
    };
  }, [startAnimation]);

  const animatedStyle = useAnimatedStyle(() => {
    const colors = STATUS_COLORS[status] ?? STATUS_COLORS.online;
    const blurRadius = Math.round((size / 4) * glowIntensity.value);
    const glowRadius = Math.round((size / 2) * glowIntensity.value);

    return {
      opacity: ringOpacity.value,
      transform: [
        { scale: ringScale.value },
        { rotate: `${ringRotation.value}deg` },
      ],
      boxShadow: `
        0 0 ${blurRadius}px ${colors.primary}80,
        0 0 ${glowRadius}px ${colors.secondary}40,
        inset 0 0 ${blurRadius / 2}px ${colors.primary}20
      `,
      borderWidth: 2,
      borderStyle: 'solid',
      borderImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}) 1`,
      borderRadius: '50%',
      width: size,
      height: size,
    };
  }) as AnimatedStyle;

  return {
    ringOpacity,
    ringScale,
    ringRotation,
    glowIntensity,
    animatedStyle,
    isActive: isActiveRef.current,
  };
}
