/**
 * Confetti Burst — Web (Reanimated v3)
 * - Physics-like: upward impulse + gravity + lateral drift + spin
 * - Deterministic seeding, reduced motion fast fallback
 *
 * Location: apps/web/src/components/chat/ConfettiBurst.tsx
 */

import { useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  type SharedValue,
  MotionView,
  type AnimatedStyle,
} from '@petspark/motion';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';
import { createSeededRNG } from '@/effects/chat/core/seeded-rng';

export interface ConfettiParticle {
  x: SharedValue<number>;
  y: SharedValue<number>;
  r: SharedValue<number>;
  s: SharedValue<number>;
  o: SharedValue<number>;
  color: string;
  w: number;
  h: number;
  delay: number;
  vx: number;
  vy: number;
}

export interface ConfettiBurstProps {
  enabled?: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  onComplete?: () => void;
  className?: string;
  seed?: number | string;
}

export function ConfettiBurst({
  enabled = true,
  particleCount = 120,
  colors = ['var(--color-accent-9)', 'var(--color-accent-secondary-9)', 'var(--color-accent-10)', 'var(--color-accent-11)', 'var(--color-accent-8)'],
  duration = 1400,
  onComplete,
  className,
  seed = 'confetti-burst',
}: ConfettiBurstProps) {
  const reduced = useReducedMotion();
  const dur = getReducedMotionDuration(duration, reduced);

  const particles = useMemo<ConfettiParticle[]>(() => {
    const rng = createSeededRNG(seed);
    return Array.from({ length: particleCount }, (_, i) => {
      const x = useSharedValue<number>(0);
      const y = useSharedValue<number>(0);
      const r = useSharedValue<number>(0);
      const s = useSharedValue<number>(rng.range(0.85, 1.25));
      const o = useSharedValue<number>(0);
      const color = colors[i % colors.length] ?? colors[0] ?? 'var(--color-accent-9)';
      const w = rng.rangeInt(6, 12);
      const h = rng.rangeInt(6, 12);
      const delay = i * (reduced ? 0 : 5);
      const vx = Math.cos(rng.range(0, Math.PI * 2)) * 40;
      const vy = -120 - rng.range(0, 80);
      return { x, y, r, s, o, color, w, h, delay, vx, vy };
    });
  }, [particleCount, colors, seed, reduced]);

  useEffect(() => {
    if (!enabled) return;

    const particleCount = particles.length;
    let completedCount = 0;

    const checkComplete = (): void => {
      completedCount += 1;
      if (completedCount === particleCount && onComplete) {
        onComplete();
      }
    };

    particles.forEach((p) => {
      if (reduced) {
        // Reduced motion: simple fast animation
        p.o.value = withTiming(1, { duration: 0 });
        p.s.value = withTiming(1, { duration: 0 });
        const reducedDuration = getReducedMotionDuration(120, true);
        p.y.value = withTiming(40, { duration: reducedDuration });
        // Fade out after y animation completes
        setTimeout(() => {
          p.o.value = withTiming(0, { duration: 120 });
          // Complete after fade out
          setTimeout(() => {
            checkComplete();
          }, 120);
        }, reducedDuration);
        return;
      }

      // Full animation sequence
      const maxDelay = Math.max(...particles.map(part => part.delay));
      const _totalDuration = maxDelay + dur + Math.max(140, dur * 0.25);

      // Start animations
      p.o.value = withDelay(p.delay, withTiming(1, { duration: 80 }));
      p.x.value = withDelay(
        p.delay,
        withTiming(p.vx, { duration: dur, easing: Easing.out(Easing.cubic) })
      );
      
      // Y animation sequence: initial upward, then fall, then fade
      const initialDuration = dur * 0.35;
      const fallDuration = dur * 0.65;
      const fadeDuration = Math.max(140, dur * 0.25);
      
      p.y.value = withDelay(
        p.delay,
        withTiming(p.vy, { duration: initialDuration, easing: Easing.out(Easing.quad) })
      );
      
      // Schedule fall animation after initial upward motion
      setTimeout(() => {
        p.y.value = withTiming(
          160,
          { duration: fallDuration, easing: Easing.in(Easing.cubic) }
        );
        
        // Schedule fade out after fall completes
        setTimeout(() => {
          p.o.value = withTiming(0, { duration: fadeDuration });
          
          // Complete after fade out
          setTimeout(() => {
            checkComplete();
          }, fadeDuration);
        }, fallDuration);
      }, p.delay + initialDuration);
      
      // Rotation animation (continuous, doesn't affect completion)
      p.r.value = withDelay(
        p.delay,
        withRepeat(
          withTiming(360, { duration: Math.max(600, dur * 0.6), easing: Easing.linear }),
          -1,
          false
        )
      );
    });
  }, [enabled, particles, dur, reduced, onComplete]);

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${className ?? ''}`}>
      {particles.map((p, i) => (
        <ConfettiParticleView key={i} particle={p} />
      ))}
    </div>
  );
}

/**
 * ConfettiParticleView component that renders a single confetti particle with animated style
 * Uses useAnimatedStyle to create reactive styles from particle SharedValues
 */
function ConfettiParticleView({ particle }: { particle: ConfettiParticle }): React.JSX.Element {
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    opacity: particle.o.value,
    transform: [
      { translateX: particle.x.value, translateY: particle.y.value, rotate: `${particle.r.value}deg`, scale: particle.s.value },
    ],
    width: particle.w,
    height: particle.h,
    backgroundColor: particle.color,
    borderRadius: 2,
  }));

  return <MotionView style={style} />;
}
