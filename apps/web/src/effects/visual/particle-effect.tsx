import { makeRng } from '@petspark/shared';
import { _motion, MotionView } from '@petspark/motion';
import { useEffect, useState } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
  blur: number;
}

interface ParticleEffectProps {
  count?: number;
  colors?: string[];
  triggerKey?: number;
  sizeRange?: [number, number];
  durationRange?: [number, number];
  withGlow?: boolean;
  className?: string;
}

export function ParticleEffect({
  count = 25,
  colors = ['#F97316', '#F59E0B', '#EF4444', '#EC4899', '#A855F7'],
  triggerKey = 0,
  sizeRange = [4, 16],
  durationRange = [1, 2.5],
  withGlow = true,
  className = '',
}: ParticleEffectProps) {
    const _uiConfig = useUIConfig();
    const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (triggerKey === 0) return;

    const [minSize, maxSize] = sizeRange;
    const [minDuration, maxDuration] = durationRange;
    const seed = triggerKey * 1000 + Date.now();
    const rng = makeRng(seed);

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const color = colors[Math.floor(rng() * colors.length)] ?? '#F97316';
      return {
        id: i + triggerKey * 1000,
        x: rng() * 300 - 150,
        y: rng() * -300 - 100,
        size: rng() * (maxSize - minSize) + minSize,
        color,
        duration: rng() * (maxDuration - minDuration) + minDuration,
        delay: rng() * 0.3,
        rotation: rng() * 360,
        blur: rng() * 2 + 0.5,
      };
    });

    setParticles(newParticles);

    const timeout = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [triggerKey, count, colors, sizeRange, durationRange]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${className}`}
    >
      {particles.map((particle) => (
        <MotionView
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: withGlow ? `0 0 ${particle.size * 1.5}px ${particle.color}` : undefined,
            filter: `blur(${particle.blur}px)`,
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0.5,
            rotate: 0,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [0, 1, 0.8, 0],
            scale: [0.5, 1, 1, 0],
            rotate: particle.rotation,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: [0.25, 1, 0.5, 1],
          }}
        />
      ))}
    </div>
  );
}
