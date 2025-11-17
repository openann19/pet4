/**
 * Reaction Burst Particles — Web (Framer Motion)
 * - Ring emission with subtle jitter
 * - Deterministic phases via seeded RNG
 * - Reduced motion → fast micro-pop (≤120ms)
 *
 * Location: apps/web/src/components/chat/ReactionBurstParticles.tsx
 */

import { useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from '@petspark/motion';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';
import { createSeededRNG } from '@/effects/chat/core/seeded-rng';
import { useUIConfig } from "@/hooks/use-ui-config";

interface ParticleProps {
  tx: number;
  ty: number;
  delay: number;
  size: number;
  color: string;
  reduced: boolean;
  dur: number;
  onFinish: () => void;
  enabled: boolean;
}

function Particle({ tx, ty, delay, size, color, reduced, dur, onFinish, enabled }: ParticleProps) {
  const sx = useMotionValue(0);
  const scale = useMotionValue(0.7);
  const opacity = useMotionValue(0);
  const x = useTransform(sx, (v) => v * tx);
  const y = useTransform(sx, (v) => v * ty);
  
  useEffect(() => {
    if (!enabled) return;
    
    if (reduced) {
      animate(opacity, 0, { duration: 0 });
      animate(scale, 1, { duration: 0 });
      animate(sx, 1, { 
        duration: getReducedMotionDuration(120, true) / 1000 
      }).then(() => {
        onFinish();
      });
      return;
    }
    
    const timeoutId = setTimeout(() => {
      animate(opacity, 1, { 
        duration: Math.max(80, dur * 0.25) / 1000,
        ease: [0.33, 1, 0.68, 1]
      });
      animate(scale, 1, { 
        type: 'spring',
        stiffness: 220,
        damping: 22
      });
      animate(sx, 1, { 
        duration: dur / 1000,
        ease: [0.33, 1, 0.68, 1]
      }).then(() => {
        animate(opacity, 0, { 
          duration: Math.max(100, dur * 0.35) / 1000 
        }).then(() => {
          onFinish();
        });
      });
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [enabled, reduced, dur, delay, onFinish, sx, scale, opacity, tx, ty]);
  
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        x,
        y,
        scale,
        opacity,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 0.7}px ${color}55`,
      }}
    />
  );
}

export interface ReactionBurstParticlesProps {
  enabled?: boolean;
  onComplete?: () => void;
  className?: string;
  count?: number;
  radius?: number;
  seed?: number | string;
  color?: string;
  size?: number;
  staggerMs?: number;
}

export function ReactionBurstParticles({
  enabled = true,
  onComplete,
  className,
  count = 18,
  radius = 48,
  seed = 'reaction-burst',
  color = 'var(--color-accent-secondary-9)',
  size = 6,
  staggerMs = 8,
}: ReactionBurstParticlesProps) {
    const _uiConfig = useUIConfig();
    const reduced = useReducedMotion();
  const dur = getReducedMotionDuration(600, reduced);

  // Generate particle positions using deterministic RNG
  const particleData = useMemo(() => {
    const rng = createSeededRNG(seed);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const jitter = rng.range(-Math.PI / 24, Math.PI / 24);
      const theta = angle + jitter;
      const tx = Math.cos(theta) * radius * rng.range(0.9, 1.05);
      const ty = Math.sin(theta) * radius * rng.range(0.9, 1.05);
      return { tx, ty, delay: i * staggerMs };
    });
  }, [count, radius, seed, staggerMs]);
  
  const finishedCount = useRef(0);
  
  const handleParticleFinish = () => {
    finishedCount.current += 1;
    if (finishedCount.current === particleData.length && onComplete) {
      onComplete();
      finishedCount.current = 0;
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className ?? ''}`}>
      {particleData.map((p, idx) => (
        <Particle 
          key={idx}
          tx={p.tx}
          ty={p.ty}
          delay={p.delay}
          size={size}
          color={color}
          reduced={reduced}
          dur={dur}
          onFinish={handleParticleFinish}
          enabled={enabled}
        />
      ))}
    </div>
  );
}
