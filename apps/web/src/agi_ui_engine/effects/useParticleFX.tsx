'use client';

import { useCallback } from 'react';
import { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  scale: number;
}

export interface UseParticleFXOptions {
  enabled?: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
}

export interface UseParticleFXReturn {
  particles: ReturnType<typeof useSharedValue<Particle[]>>;
  trigger: (x: number, y: number) => void;
  animatedStyle: AnimatedStyle;
  isActive: ReturnType<typeof useSharedValue<boolean>>;
}

/**
 * Particle explosion effect for reactions, send, delete actions
 *
 * Creates particle burst effects with configurable colors and count
 *
 * @example
 * ```tsx
 * const { trigger, animatedStyle } = useParticleFX({
 *   colors: ['#FF6B6B', '#4ECDC4'],
 *   particleCount: 20
 * })
 *
 * const handleClick = () => {
 *   trigger(100, 100)
 * }
 * ```
 */
export function useParticleFX(options: UseParticleFXOptions = {}): UseParticleFXReturn {
  const { enabled = true, particleCount = 15, duration = 800 } = options;

  const { animation } = useUIConfig();

  const particles = useSharedValue<Particle[]>([]);
  const isActive = useSharedValue(false);

  const generateParticles = useCallback(
    (x: number, y: number): Particle[] => {
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 4;

        newParticles.push({
          id: `particle-${String(i ?? '')}-${String(Date.now() ?? '')}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          opacity: 1,
          scale: 0.5 + Math.random() * 0.5,
        });
      }

      return newParticles;
    },
    [particleCount]
  );

  const trigger = useCallback(
    (x: number, y: number): void => {
      if (!enabled || !animation.showParticles) {
        return;
      }

      isActive.value = true;
      particles.value = generateParticles(x, y);

      particles.value = particles.value.map((particle) => ({
        ...particle,
        opacity: withTiming(0, {
          duration,
          easing: Easing.out(Easing.ease),
        }),
        scale: withTiming(0, {
          duration,
          easing: Easing.out(Easing.ease),
        }),
      }));

      setTimeout(() => {
        isActive.value = false;
        particles.value = [];
      }, duration);
    },
    [enabled, animation.showParticles, generateParticles, particles, isActive, duration]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !animation.showParticles || !isActive.value) {
      return {
        opacity: 0,
        pointerEvents: 'none' as const,
      };
    }

    return {
      opacity: 1,
      pointerEvents: 'auto' as const,
    };
  }) as AnimatedStyle;

  return {
    particles,
    trigger,
    animatedStyle,
    isActive,
  };
}
