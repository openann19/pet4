'use client';

import { useAnimatedStyle, useSharedValue } from '@petspark/motion';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  spawnParticlesData,
  animateParticle,
  type Particle,
  type ParticleConfig,
  type ParticleData,
  DEFAULT_CONFIG,
} from '@/effects/reanimated/particle-engine';

export interface UseParticleExplosionDeleteOptions {
  originX?: number;
  originY?: number;
  colors?: string[];
  particleCount?: number;
  enabled?: boolean;
}

export interface UseParticleExplosionDeleteReturn {
  particles: Particle[];
  triggerExplosion: (x: number, y: number, colors?: string[]) => void;
  clearParticles: () => void;
  /**
   * @deprecated Use ParticleView component instead
   * This method is kept for backward compatibility but should not be used
   * Components should use ParticleView component which properly handles useAnimatedStyle
   */
  getParticleStyle: (particle: Particle) => ReturnType<typeof useAnimatedStyle>;
}

const DEFAULT_PARTICLE_COUNT = 15;
const DEFAULT_ENABLED = true;
const MAX_PARTICLES = 50; // Maximum particles in pool
const DEFAULT_EXPLOSION_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#FFD93D',
  '#FF6B35',
];

interface ActiveParticle {
  particle: Particle;
  data: ParticleData;
  poolIndex: number;
}

export function useParticleExplosionDelete(
  options: UseParticleExplosionDeleteOptions = {}
): UseParticleExplosionDeleteReturn {
  const {
    colors = DEFAULT_EXPLOSION_COLORS,
    particleCount = DEFAULT_PARTICLE_COUNT,
    enabled = DEFAULT_ENABLED,
  } = options;

  // Pre-create particle pool with SharedValues at hook level
  // This ensures all hooks are called at the top level
  // React allows calling hooks in loops as long as the count is constant
  const particlePool = Array.from({ length: MAX_PARTICLES }, (_, index) => ({
    id: `pool-${index}`,
    x: useSharedValue(0),
    y: useSharedValue(0),
    scale: useSharedValue(0),
    opacity: useSharedValue(0),
    rotation: useSharedValue(0),
    vx: 0,
    vy: 0,
    color: '',
    size: 0,
    lifetime: 0,
    createdAt: 0,
    rotationTarget: 0,
  }));

  // Track active particles and their pool indices
  const [activeParticles, setActiveParticles] = useState<ActiveParticle[]>([]);
  const nextPoolIndexRef = useRef(0);
  const activePoolIndicesRef = useRef<Set<number>>(new Set());

  // Convert active particles to Particle array for return value
  const particles = useMemo(() => {
    return activeParticles.map((ap) => ap.particle);
  }, [activeParticles]);

  const triggerExplosion = useCallback(
    (x: number, y: number, explosionColors?: string[]) => {
      if (!enabled) return;

      const particleConfig: ParticleConfig = {
        count: particleCount,
        colors: explosionColors ?? colors,
        minSize: 6,
        maxSize: 14,
        minLifetime: 600,
        maxLifetime: 1000,
        minVelocity: 200,
        maxVelocity: 400,
        gravity: 0.5,
        friction: 0.97,
        spread: 360,
      };

      const fullConfig = {
        ...DEFAULT_CONFIG,
        ...particleConfig,
        count: particleConfig.count ?? DEFAULT_PARTICLE_COUNT,
        colors: particleConfig.colors ?? colors,
      };

      // Get particle data (no hooks called here)
      const particlesData = spawnParticlesData(x, y, particleConfig);

      // Activate particles from pool
      const newActiveParticles: ActiveParticle[] = [];
      const now = Date.now();

      particlesData.forEach((data) => {
        // Find next available particle in pool
        let poolIndex = nextPoolIndexRef.current;
        let attempts = 0;
        while (activePoolIndicesRef.current.has(poolIndex) && attempts < MAX_PARTICLES) {
          poolIndex = (poolIndex + 1) % MAX_PARTICLES;
          attempts++;
        }

        if (attempts >= MAX_PARTICLES) {
          // Pool exhausted, skip this particle
          return;
        }

        const poolParticle = particlePool[poolIndex];
        if (!poolParticle) {
          return;
        }

        // Initialize particle from pool with data
        poolParticle.x.value = data.startX;
        poolParticle.y.value = data.startY;
        poolParticle.scale.value = 0;
        poolParticle.opacity.value = 1;
        poolParticle.rotation.value = 0;
        poolParticle.vx = data.vx;
        poolParticle.vy = data.vy;
        poolParticle.color = data.color;
        poolParticle.size = data.size;
        poolParticle.lifetime = data.lifetime;
        poolParticle.createdAt = now;
        poolParticle.rotationTarget = data.rotationTarget;
        poolParticle.id = data.id;

        // Create particle object for active tracking
        const particle: Particle = {
          id: data.id,
          x: poolParticle.x,
          y: poolParticle.y,
          scale: poolParticle.scale,
          opacity: poolParticle.opacity,
          rotation: poolParticle.rotation,
          vx: data.vx,
          vy: data.vy,
          color: data.color,
          size: data.size,
          lifetime: data.lifetime,
          createdAt: now,
          rotationTarget: data.rotationTarget,
        };

        // Animate the particle
        animateParticle(particle, fullConfig);

        newActiveParticles.push({
          particle,
          data,
          poolIndex,
        });

        activePoolIndicesRef.current.add(poolIndex);
        nextPoolIndexRef.current = (poolIndex + 1) % MAX_PARTICLES;
      });

      setActiveParticles((prev) => [...prev, ...newActiveParticles]);

      // Clean up particles after animation
      setTimeout(() => {
        setActiveParticles((prev) => {
          const filtered = prev.filter((ap) => {
            const isExpired = Date.now() - ap.particle.createdAt > ap.particle.lifetime + 200;
            if (isExpired) {
              activePoolIndicesRef.current.delete(ap.poolIndex);
            }
            return !isExpired;
          });
          return filtered;
        });
      }, 1200);
    },
    [enabled, particleCount, colors, particlePool]
  );

  const clearParticles = useCallback(() => {
    activePoolIndicesRef.current.clear();
    setActiveParticles([]);
  }, []);

  // getParticleStyle is kept for backward compatibility
  // Components should use ParticleView component instead which properly handles useAnimatedStyle
  // This returns a static style object (not reactive) - use ParticleView for reactive animations
  const getParticleStyle = useCallback(
    (particle: Particle): ReturnType<typeof useAnimatedStyle> => {
      // Return a static style object that references current SharedValue values
      // Note: This is not reactive - use ParticleView component for reactive animations
      return {
        position: 'absolute' as const,
        left: particle.x.value,
        top: particle.y.value,
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
        borderRadius: particle.size / 2,
        opacity: particle.opacity.value,
        transform: [
          { translateX: particle.x.value },
          { translateY: particle.y.value },
          { scale: particle.scale.value },
          { rotate: `${particle.rotation.value}deg` },
        ],
        pointerEvents: 'none' as const,
        zIndex: 9999,
      } as ReturnType<typeof useAnimatedStyle>;
    },
    []
  );

  // Cleanup expired particles periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveParticles((prev) => {
        const filtered = prev.filter((ap) => {
          const isExpired = Date.now() - ap.particle.createdAt > ap.particle.lifetime + 200;
          if (isExpired) {
            activePoolIndicesRef.current.delete(ap.poolIndex);
          }
          return !isExpired;
        });
        return filtered;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    particles,
    triggerExplosion,
    clearParticles,
    getParticleStyle,
  };
}
