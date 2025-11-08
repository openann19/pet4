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
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { createLogger } from '@/lib/logger';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import { randomRange } from '../core/seeded-rng';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

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
  const containerOpacity = useSharedValue(0);

  // Create particles (limit to 120 max for performance)
  const actualParticleCount = Math.min(particleCount, 120);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  // Initialize particles
  if (particlesRef.current.length === 0) {
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

    const duration =
      customDuration ??
      DEFAULT_DURATION_MIN + randomRange(0, DEFAULT_DURATION_MAX - DEFAULT_DURATION_MIN);
    const isReducedMotion = reducedMotion.value;
    const finalDuration = isReducedMotion
      ? getReducedMotionDuration(DEFAULT_DURATION_MIN, true)
      : duration;

    // Log effect start
    const effectId = logEffectStart('confetti-match', {
      durationMs: finalDuration,
      reducedMotion: isReducedMotion,
      particleCount: actualParticleCount,
    });

    // Show container
    containerOpacity.value = withTiming(1, {
      duration: 50,
      easing: Easing.out(Easing.ease),
    });

    // Animate particles
    if (!isReducedMotion) {
      particlesRef.current.forEach((particle) => {
        const angle = randomRange(0, Math.PI * 2);
        const velocity = randomRange(200, 400);
        const xVelocity = Math.cos(angle) * velocity;
        const yVelocity = Math.sin(angle) * velocity;

        // X movement
        particle.x.value = withTiming(xVelocity * (duration / 1000), {
          duration,
          easing: Easing.out(Easing.quad),
        });

        // Y movement (gravity)
        particle.y.value = withTiming(yVelocity * (duration / 1000) + 500, {
          duration,
          easing: Easing.in(Easing.quad),
        });

        // Rotation
        particle.rotation.value = withTiming(360 * randomRange(2, 5), {
          duration,
          easing: Easing.linear,
        });

        // Opacity fade
        particle.opacity.value = withTiming(
          1,
          {
            duration: duration * 0.1,
            easing: Easing.out(Easing.ease),
          },
          () => {
            particle.opacity.value = withTiming(0, {
              duration: duration * 0.9,
              easing: Easing.in(Easing.ease),
            });
          }
        );

        // Scale
        particle.scale.value = withTiming(
          1,
          {
            duration: duration * 0.2,
            easing: Easing.out(Easing.ease),
          },
          () => {
            particle.scale.value = withTiming(0.5, {
              duration: duration * 0.8,
              easing: Easing.in(Easing.ease),
            });
          }
        );
      });
    } else {
      // Reduced motion: instant opacity change
      particlesRef.current.forEach((particle) => {
        particle.opacity.value = withTiming(
          1,
          {
            duration: 120,
            easing: Easing.linear,
          },
          () => {
            particle.opacity.value = withTiming(0, {
              duration: 120,
              easing: Easing.linear,
            });
          }
        );
      });
    }

    // Hide container after animation
    setTimeout(() => {
      containerOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }, duration);

    // Call onComplete
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, duration);
    }

    // Log effect end
    setTimeout(() => {
      logEffectEnd(effectId, {
        durationMs: duration,
        success: true,
      });
    }, duration);
  }, [enabled, customDuration, reducedMotion, containerOpacity, onComplete, actualParticleCount]);

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
