'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseParticleBurstOnSendOptions {
  enabled?: boolean;
}

export interface UseParticleBurstOnSendReturn {
  trigger: (x: number, y: number) => void;
  animatedStyle: AnimatedStyle;
}

/**
 * Particle burst effect on send
 *
 * Creates particle explosion when message is sent
 *
 * @example
 * ```tsx
 * const { trigger } = useParticleBurstOnSend()
 * const handleSend = () => {
 *   trigger(100, 100)
 * }
 * ```
 */
export function useParticleBurstOnSend(
  options: UseParticleBurstOnSendOptions = {}
): UseParticleBurstOnSendReturn {
  const { enabled = true } = options;
  const { animation } = useUIConfig();

  const particles = useSharedValue(0);

  const trigger = useCallback(
    (_x: number, _y: number): void => {
      if (!enabled || !animation.showParticles) {
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
    [enabled, animation.showParticles, particles]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !animation.showParticles) {
      return {};
    }

    return {
      opacity: particles.value,
    };
  }) as AnimatedStyle;

  return {
    trigger,
    animatedStyle,
  };
}
