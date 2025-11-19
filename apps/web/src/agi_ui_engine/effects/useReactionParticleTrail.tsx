'use client';

import { useCallback } from 'react';
import { useSharedValue, withTiming, Easing, useAnimatedStyle, type AnimatedStyle } from '@petspark/motion';

import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseReactionParticleTrailOptions {
  enabled?: boolean;
}

export interface UseReactionParticleTrailReturn {
  animatedStyle: AnimatedStyle;
  trigger: (x: number, y: number) => void;
  particles: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Reaction particle trail effect
 *
 * Creates particle trail when reactions are added
 *
 * @example
 * ```tsx
 * const { trigger } = useReactionParticleTrail({ emoji: '❤️' })
 * const handleReact = () => trigger(100, 100)
 * ```
 */
export function useReactionParticleTrail(
  options: UseReactionParticleTrailOptions = {}
): UseReactionParticleTrailReturn {
  const { enabled = true } = options;
  const { animation } = useUIConfig();

  const particles = useSharedValue<number>(0);

  const trigger = useCallback(
    (_x: number, _y: number): void => {
      if (!enabled || !animation.showParticles || !animation.showTrails) {
        return;
      }

      particles.value = withTiming(1, {
        duration: 100,
        easing: Easing.out(Easing.ease),
      });

      setTimeout(() => {
        particles.value = withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        });
      }, 100);
    },
    [enabled, animation.showParticles, animation.showTrails, particles]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !animation.showTrails) {
      return {};
    }

    return {
      opacity: particles.value,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    trigger,
    particles,
  };
}
