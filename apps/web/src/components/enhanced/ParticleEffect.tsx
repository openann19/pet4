import React, { useEffect, useState } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  animate,
} from '@petspark/motion';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';

/**
 * Seeded Random Number Generator
 * Xorshift32 algorithm for deterministic random number generation.
 */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

interface ParticleEffectProps {
  count?: number;
  colors?: string[];
  triggerKey?: number;
}

function ParticleAnimated({ particle }: { particle: Particle }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const delayMs = particle.delay * 1000;
    const durationMs = particle.duration * 1000;

    const opacitySequence = withSequence(
      withTiming(1, { duration: durationMs * 0.2 }),
      withTiming(1, { duration: durationMs * 0.6 }),
      withTiming(0, { duration: durationMs * 0.2 })
    );
    const opacityDelay = withDelay(delayMs, opacitySequence);
    animate(opacity, opacityDelay.target, opacityDelay.transition);

    const scaleSequence = withSequence(
      withTiming(1, { duration: durationMs * 0.2 }),
      withTiming(1, { duration: durationMs * 0.6 }),
      withTiming(0, { duration: durationMs * 0.2 })
    );
    const scaleDelay = withDelay(delayMs, scaleSequence);
    animate(scale, scaleDelay.target, scaleDelay.transition);

    const translateXDelay = withDelay(delayMs, withTiming(particle.x, { duration: durationMs }));
    animate(translateX, translateXDelay.target, translateXDelay.transition);

    const translateYDelay = withDelay(delayMs, withTiming(particle.y, { duration: durationMs }));
    animate(translateY, translateYDelay.target, translateYDelay.transition);
  }, [particle, opacity, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle((): Record<string, unknown> => ({
    opacity: opacity.get(),
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
    ],
  }));

  const styleValue = useAnimatedStyleValue(animatedStyle);

  return (
    <div
      className="absolute rounded-full"
      style={{
        ...styleValue,
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
      }}
    />
  );
}

export function ParticleEffect({
  count = 20,
  colors = ['#F97316', '#F59E0B', 'var(--color-error-9)', '#EC4899', '#A855F7'],
  triggerKey = 0,
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (triggerKey === 0) return;

    const seed = triggerKey * 1000 + Date.now();
    const rng = makeRng(seed);

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const colorIndex = Math.floor(rng() * colors.length);
      const selectedColor = colors[colorIndex];
      return {
        id: i + triggerKey * 1000,
        x: rng() * 100 - 50,
        y: rng() * -100 - 50,
        size: rng() * 12 + 4,
        color: selectedColor ?? '#F97316',
        duration: rng() * 1.5 + 1,
        delay: rng() * 0.3,
      };
    });

    setParticles(newParticles);

    const timeout = setTimeout(() => {
      setParticles([]);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [triggerKey, count, colors]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {particles.map((particle) => (
        <ParticleAnimated key={particle.id} particle={particle} />
      ))}
    </div>
  );
}
