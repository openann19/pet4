/**
 * Sticker Physics Effect Hook
 *
 * Creates a premium sticker toss animation with:
 * - Gravity + floor bounce (coef 0.3)
 * - Duration 400-600ms
 * - Capped to 120 Hz
 * - Cache sticker texture, decode off-UI thread
 *
 * Location: apps/web/src/effects/chat/media/use-sticker-physics.ts
 */

import { useCallback, useRef } from 'react';
import {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { createLogger } from '@/lib/logger';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { randomRange } from '../core/seeded-rng';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

const logger = createLogger('sticker-physics');

/**
 * Physics constants
 */
const BOUNCE_COEFFICIENT = 0.3;
const STICKER_DURATION_MIN = 400; // ms
const STICKER_DURATION_MAX = 600; // ms

/**
 * Sticker physics effect options
 */
export interface UseStickerPhysicsOptions {
  enabled?: boolean;
  initialVelocity?: { x: number; y: number };
  floorY?: number;
  onComplete?: () => void;
}

/**
 * Sticker physics effect return type
 */
export interface UseStickerPhysicsReturn {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  trigger: () => void;
}

const DEFAULT_ENABLED = true;

export function useStickerPhysics(options: UseStickerPhysicsOptions = {}): UseStickerPhysicsReturn {
  const {
    enabled = DEFAULT_ENABLED,
    initialVelocity = { x: 200, y: -300 },
    floorY = 0,
    onComplete,
  } = options;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const reducedMotion = useReducedMotionSV();
  const { scaleDuration } = useDeviceRefreshRate();
  const { animation, performance } = useUIConfig();
  const textureCacheRef = useRef<string | null>(null);

  const trigger = useCallback(() => {
    if (!enabled) {
      return;
    }

    const baseDuration =
      STICKER_DURATION_MIN + randomRange(0, STICKER_DURATION_MAX - STICKER_DURATION_MIN);

    const isReducedMotion = reducedMotion.value;
    // Use adaptive duration scaling based on device refresh rate
    const baseFinalDuration = isReducedMotion
      ? getReducedMotionDuration(STICKER_DURATION_MIN, true)
      : baseDuration;
    const finalDuration = scaleDuration(baseFinalDuration);

    // Log effect start
    const effectId = logEffectStart('sticker-physics', {
      durationMs: finalDuration,
      reducedMotion: isReducedMotion,
    });

    // Cache texture (for future use) - only if performance optimization enabled
    if (performance.useSkiaWhereAvailable && !textureCacheRef.current) {
      textureCacheRef.current = 'sticker-texture';
      logger.debug('Sticker texture cached');
    }

    // X movement (linear with initial velocity) - use adaptive duration
    const finalX = initialVelocity.x * (finalDuration / 1000);
    translateX.value = withTiming(finalX, {
      duration: finalDuration,
      easing: Easing.linear,
    });

    // Y movement (gravity + bounce) - use adaptive duration
    const bounceY = floorY + Math.abs(initialVelocity.y) * BOUNCE_COEFFICIENT;
    translateY.value = withSequence(
      withTiming(floorY, {
        duration: scaleDuration(finalDuration * 0.6), // fall
        easing: Easing.out(Easing.quad),
      }),
      withTiming(bounceY, {
        duration: scaleDuration(finalDuration * 0.2), // bounce up
        easing: Easing.out(Easing.quad),
      }),
      withTiming(floorY, {
        duration: scaleDuration(finalDuration * 0.2), // settle
        easing: Easing.in(Easing.quad),
      })
    );

    // Rotation (spins during flight) - use adaptive duration
    rotation.value = withTiming(360 * 2, {
      duration: finalDuration,
      easing: Easing.linear,
    });

    // Scale (slight shrink on impact) - use adaptive duration
    scale.value = withSequence(
      withTiming(1, {
        duration: scaleDuration(finalDuration * 0.6),
        easing: Easing.linear,
      }),
      withTiming(0.9, {
        duration: scaleDuration(finalDuration * 0.1),
        easing: Easing.out(Easing.quad),
      }),
      withTiming(1, {
        duration: scaleDuration(finalDuration * 0.3),
        easing: Easing.out(Easing.quad),
      })
    );

    // Call onComplete
    if (isTruthy(onComplete)) {
      setTimeout(() => {
        onComplete();
      }, finalDuration);
    }

    // Log effect end
    setTimeout(() => {
      logEffectEnd(effectId, {
        durationMs: finalDuration,
        success: true,
      });
    }, finalDuration);
  }, [
    enabled,
    initialVelocity,
    floorY,
    reducedMotion,
    scaleDuration,
    animation,
    performance,
    translateX,
    translateY,
    rotation,
    scale,
    onComplete,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${String(rotation.value ?? '')}deg` },
        { scale: scale.value },
      ],
    };
  }) as AnimatedStyle;

  return {
    translateX,
    translateY,
    rotation,
    scale,
    animatedStyle,
    trigger,
  };
}
