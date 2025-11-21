/**
 * Confetti Burst Effect Hook
 *
 * Creates a premium confetti celebration animation with:
 * - GPU particle emitter (120 particles max, 600-900ms duration)
 * - Colorful particles with physics
 * - Reduced motion → instant opacity change
 *
 * Location: apps/web/src/effects/chat/celebrations/use-confetti-burst.ts
 */

import { useCallback, useRef } from 'react';
import {
  animate,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { createLogger } from '@/lib/logger';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import { randomRange } from '../core/seeded-rng';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@petspark/motion';

const logger = createLogger('confetti-burst');

/**
 * Confetti particle configuration
 */
export interface ConfettiParticle {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  color: string;
}

/**
 * Confetti burst effect options
 */
export interface UseConfettiBurstOptions {
  enabled?: boolean;
  particleCount?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

/**
 * Confetti burst effect return type
 */
export interface UseConfettiBurstReturn {
  particles: ConfettiParticle[];
  containerOpacity: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  trigger: () => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_PARTICLE_COUNT = 120;
const DEFAULT_DURATION_MIN = 600; // ms
const DEFAULT_DURATION_MAX = 900; // ms
const DEFAULT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#E74C3C',
];

export function useConfettiBurst(options: UseConfettiBurstOptions = {}): UseConfettiBurstReturn {
  const {
    enabled = DEFAULT_ENABLED,
    particleCount = DEFAULT_PARTICLE_COUNT,
    duration: customDuration,
    colors = DEFAULT_COLORS,
    onComplete,
  } = options;

  const reducedMotion = useReducedMotionSV();
  const { scaleDuration, deviceCapability } = useDeviceRefreshRate();
  const { animation, feedback } = useUIConfig();
  const containerOpacity = useSharedValue(0);

  // Create particles (limit based on device capability and UI config)
  // Respect device capability limits: 60-200 particles based on device performance
  // Disable particles entirely if animation.showParticles is false
  const maxParticleCount = animation.showParticles ? deviceCapability.maxParticles : 0;
  const actualParticleCount = Math.min(particleCount, maxParticleCount);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  // Initialize particles (only if particles are enabled)
  if (particlesRef.current.length === 0 && actualParticleCount > 0) {
    particlesRef.current = Array.from({ length: actualParticleCount }, () => {
      const angle = randomRange(0, Math.PI * 2);
      const velocity = randomRange(200, 400);
      const xVelocity = Math.cos(angle) * velocity;
      const yVelocity = Math.sin(angle) * velocity;

      return {
        x: useSharedValue(0),
        y: useSharedValue(0),
        rotation: useSharedValue(0),
        opacity: useSharedValue(0),
        scale: useSharedValue(1),
        color: colors[Math.floor(randomRange(0, colors.length))] ?? DEFAULT_COLORS[0] ?? '#FF6B6B',
      };
    });
  }

  const trigger = useCallback(() => {
    if (!enabled) {
      return;
    }

    const baseDuration =
      customDuration ??
      DEFAULT_DURATION_MIN + randomRange(0, DEFAULT_DURATION_MAX - DEFAULT_DURATION_MIN);
    const isReducedMotion = reducedMotion.value;
    // Use adaptive duration scaling based on device refresh rate
    const baseFinalDuration = isReducedMotion
      ? getReducedMotionDuration(DEFAULT_DURATION_MIN, true)
      : baseDuration;
    const finalDuration = scaleDuration(baseFinalDuration);

    // Log effect start
    const effectId = logEffectStart('confetti-match', {
      durationMs: finalDuration,
      reducedMotion: isReducedMotion,
      particleCount: actualParticleCount,
    });

    // Show container - use adaptive duration
    const containerFadeInDuration = scaleDuration(50);
    containerOpacity.value = withTiming(1, {
      duration: containerFadeInDuration,
      easing: Easing.out(Easing.ease),
    });

    // Animate particles (only if particles enabled and count > 0)
    if (!isReducedMotion && animation.showParticles && actualParticleCount > 0) {
      particlesRef.current.forEach((particle) => {
        const angle = randomRange(0, Math.PI * 2);
        const velocity = randomRange(200, 400);
        const xVelocity = Math.cos(angle) * velocity;
        const yVelocity = Math.sin(angle) * velocity;

        // X movement - use adaptive duration
        particle.x.value = withTiming(xVelocity * (finalDuration / 1000), {
          duration: finalDuration,
          easing: Easing.out(Easing.quad),
        });

        // Y movement (gravity) - use adaptive duration
        particle.y.value = withTiming(yVelocity * (finalDuration / 1000) + 500, {
          duration: finalDuration,
          easing: Easing.in(Easing.quad),
        });

        // Rotation - use adaptive duration
        particle.rotation.value = withTiming(360 * randomRange(2, 5), {
          duration: finalDuration,
          easing: Easing.linear,
        });

        // Opacity fade - use adaptive duration
        const opacityFadeInDuration = scaleDuration(finalDuration * 0.1);
        particle.opacity.value = withTiming(1, {
          duration: opacityFadeInDuration,
          easing: Easing.out(Easing.ease),
        });
        void animate(particle.opacity, 0, {
          type: 'tween',
          delay: opacityFadeInDuration / 1000,
          duration: scaleDuration(finalDuration * 0.9) / 1000,
          ease: 'easeIn',
        });

        // Scale - use adaptive duration
        const scaleInDuration = scaleDuration(finalDuration * 0.2);
        particle.scale.value = withTiming(1, {
          duration: scaleInDuration,
          easing: Easing.out(Easing.ease),
        });
        void animate(particle.scale, 0.5, {
          type: 'tween',
          delay: scaleInDuration / 1000,
          duration: scaleDuration(finalDuration * 0.8) / 1000,
          ease: 'easeIn',
        });
      });
    } else {
      // Reduced motion: instant opacity change - use adaptive duration
      const reducedOpacityDuration = scaleDuration(120);
      particlesRef.current.forEach((particle) => {
        particle.opacity.value = withTiming(1, {
          duration: reducedOpacityDuration,
          easing: Easing.linear,
        });
        void animate(particle.opacity, 0, {
          type: 'tween',
          delay: reducedOpacityDuration / 1000,
          duration: reducedOpacityDuration / 1000,
          ease: 'linear',
        });
      });
    }

    // Hide container after animation - use adaptive duration
    const containerFadeOutDuration = scaleDuration(200);
    setTimeout(() => {
      containerOpacity.value = withTiming(0, {
        duration: containerFadeOutDuration,
        easing: Easing.in(Easing.ease),
      });
    }, finalDuration);

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
    customDuration,
    reducedMotion,
    scaleDuration,
    animation,
    feedback,
    containerOpacity,
    onComplete,
    actualParticleCount,
    deviceCapability,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
    };
  }) as AnimatedStyle;

  return {
    particles: particlesRef.current,
    containerOpacity,
    animatedStyle,
    trigger,
  };
}
