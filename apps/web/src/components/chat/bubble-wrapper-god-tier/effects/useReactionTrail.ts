'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  type SharedValue,
} from '@petspark/motion';
import { useCallback, useState, useEffect } from 'react';
import { makeRng } from '@petspark/shared';

export interface ReactionTrailParticle {
  id: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  rotation: SharedValue<number>;
  emoji: string;
  createdAt: number;
}

export interface UseReactionTrailOptions {
  enabled?: boolean;
  trailLength?: number;
  duration?: number;
  emoji?: string;
}

export interface UseReactionTrailReturn {
  particles: ReactionTrailParticle[];
  triggerTrail: (fromX: number, fromY: number, toX: number, toY: number, emoji?: string) => void;
  clearTrail: () => void;
  getParticleStyle: (particle: ReactionTrailParticle) => ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_TRAIL_LENGTH = 5;
const DEFAULT_DURATION = 1000;
const DEFAULT_EMOJI = '❤️';

export function useReactionTrail(options: UseReactionTrailOptions = {}): UseReactionTrailReturn {
  const {
    enabled = DEFAULT_ENABLED,
    trailLength = DEFAULT_TRAIL_LENGTH,
    duration = DEFAULT_DURATION,
    emoji = DEFAULT_EMOJI,
  } = options;

  const [particles, setParticles] = useState<ReactionTrailParticle[]>([]);

  const triggerTrail = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number, trailEmoji?: string) => {
      if (!enabled) return;

      const particlesToCreate: ReactionTrailParticle[] = [];
      const emojiToUse = trailEmoji ?? emoji;

      // Create seeded RNG for deterministic particle generation
      const seed = Date.now() + fromX + fromY + toX + toY;
      const rng = makeRng(seed);

      for (let i = 0; i < trailLength; i++) {
        const progress = i / (trailLength - 1);
        const x = fromX + (toX - fromX) * progress;
        const y = fromY + (toY - fromY) * progress;
        const offsetX = (rng() - 0.5) * 30;
        const offsetY = (rng() - 0.5) * 30;

        const particle: ReactionTrailParticle = {
          id: `${String(Date.now() ?? '')}-${String(i ?? '')}-${String(rng() ?? '')}`,
          x: useSharedValue<number>(x + offsetX),
          y: useSharedValue<number>(y + offsetY),
          scale: useSharedValue<number>(0),
          opacity: useSharedValue<number>(0),
          rotation: useSharedValue<number>(0),
          emoji: emojiToUse,
          createdAt: Date.now(),
        };

        const delay = progress * (duration * 0.3);
        const particleDuration = duration * 0.7;

        particle.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1.2, {
              duration: particleDuration * 0.2,
              easing: Easing.out(Easing.back(1.5)),
            }),
            withTiming(0.8, {
              duration: particleDuration * 0.6,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0, {
              duration: particleDuration * 0.2,
              easing: Easing.in(Easing.ease),
            })
          )
        );

        particle.opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(1, {
              duration: particleDuration * 0.1,
              easing: Easing.out(Easing.ease),
            }),
            withTiming(0.9, {
              duration: particleDuration * 0.7,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0, {
              duration: particleDuration * 0.2,
              easing: Easing.in(Easing.ease),
            })
          )
        );

        particle.rotation.value = withDelay(
          delay,
          withTiming(rng() * 360, {
            duration: particleDuration,
            easing: Easing.linear,
          })
        );

        const finalX = toX + (rng() - 0.5) * 20;
        const finalY = toY + (rng() - 0.5) * 20;

        particle.x.value = withDelay(
          delay,
          withTiming(finalX, {
            duration: particleDuration,
            easing: Easing.out(Easing.quad),
          })
        );

        particle.y.value = withDelay(
          delay,
          withTiming(finalY, {
            duration: particleDuration,
            easing: Easing.out(Easing.quad),
          })
        );

        particlesToCreate.push(particle);
      }

      setParticles((prev) => [...prev, ...particlesToCreate]);

      setTimeout(() => {
        setParticles((prev: ReactionTrailParticle[]) =>
          prev.filter((p: ReactionTrailParticle) => Date.now() - p.createdAt < duration + 200)
        );
      }, duration + 300);
    },
    [enabled, trailLength, duration, emoji]
  );

  const clearTrail = useCallback(() => {
    setParticles([]);
  }, []);

  const getParticleStyle = useCallback(
    (particle: ReactionTrailParticle): ReturnType<typeof useAnimatedStyle> => {
      return useAnimatedStyle(() => {
        const scale = particle.scale.value;
        const rotate = `${particle.rotation.value}deg`;
        return {
          position: 'absolute' as const,
          left: particle.x.value,
          top: particle.y.value,
          transform: [{ scale, rotate }],
          opacity: particle.opacity.value,
          pointerEvents: 'none' as const,
          zIndex: 9999,
        };
      });
    },
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev: ReactionTrailParticle[]) =>
        prev.filter((p: ReactionTrailParticle) => Date.now() - p.createdAt < duration + 200)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  return {
    particles,
    triggerTrail,
    clearTrail,
    getParticleStyle,
  };
}
