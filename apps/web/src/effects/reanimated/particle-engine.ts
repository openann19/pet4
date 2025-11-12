'use client';

import { makeRng } from '@petspark/shared';
import {
  Easing,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export interface ParticleData {
  id: string;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  createdAt: number;
  rotationTarget: number;
}

export interface Particle {
  id: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  rotation: SharedValue<number>;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  createdAt: number;
  rotationTarget: number;
}

export interface ParticleConfig {
  count?: number;
  colors?: string[];
  size?: number;
  minSize?: number;
  maxSize?: number;
  lifetime?: number;
  minLifetime?: number;
  maxLifetime?: number;
  velocity?: number;
  minVelocity?: number;
  maxVelocity?: number;
  gravity?: number;
  friction?: number;
  spread?: number;
}

export const DEFAULT_CONFIG: Required<ParticleConfig> = {
  count: 10,
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
  size: 8,
  minSize: 4,
  maxSize: 12,
  lifetime: 800,
  minLifetime: 600,
  maxLifetime: 1000,
  velocity: 200,
  minVelocity: 150,
  maxVelocity: 300,
  gravity: 0.3,
  friction: 0.98,
  spread: 360,
};

export function createParticleData(
  startX: number,
  startY: number,
  angle: number,
  config: Required<ParticleConfig>,
  seed?: number
): ParticleData {
  const rng = makeRng(seed ?? Date.now());
  const id = `${Date.now()}-${rng()}`;
  const velocity = config.minVelocity + rng() * (config.maxVelocity - config.minVelocity);
  const lifetime = config.minLifetime + rng() * (config.maxLifetime - config.minLifetime);
  const size = config.minSize + rng() * (config.maxSize - config.minSize);
  const colorIndex = Math.floor(rng() * config.colors.length);
  const color = config.colors[colorIndex] ?? config.colors[0] ?? '#FF6B6B';
  const radians = (angle * Math.PI) / 180;

  const vx = Math.cos(radians) * velocity;
  const vy = Math.sin(radians) * velocity;
  const rotationRng = makeRng(Date.now());
  const rotationTarget = rotationRng() * 360;

  return {
    id,
    startX,
    startY,
    vx,
    vy,
    color,
    size,
    lifetime,
    createdAt: Date.now(),
    rotationTarget,
  };
}

export function spawnParticlesData(
  originX: number,
  originY: number,
  config: ParticleConfig = {},
  seed?: number
): ParticleData[] {
  const fullConfig: Required<ParticleConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const particles: ParticleData[] = [];
  const angleStep = fullConfig.spread / fullConfig.count;
  const rng = makeRng(seed ?? Date.now());

  for (let i = 0; i < fullConfig.count; i++) {
    const angle = -fullConfig.spread / 2 + i * angleStep + (rng() - 0.5) * 20;
    const particle = createParticleData(originX, originY, angle, fullConfig, seed);
    particles.push(particle);
  }

  return particles;
}

/**
 * @deprecated Use spawnParticlesData and createParticleFromData in hooks instead
 * This function is kept for backward compatibility but will be removed
 */
export function spawnParticles(
  originX: number,
  originY: number,
  config: ParticleConfig = {},
  seed?: number
): ParticleData[] {
  return spawnParticlesData(originX, originY, config, seed);
}

export function animateParticle(particle: Particle, config: Required<ParticleConfig>): void {
  const endX = particle.x.value + particle.vx * (particle.lifetime / 1000);
  const endY =
    particle.y.value +
    particle.vy * (particle.lifetime / 1000) +
    (config.gravity * particle.lifetime * particle.lifetime) / 2000;

  particle.x.value = withTiming(endX, {
    duration: particle.lifetime,
    easing: Easing.out(Easing.quad),
  });

  particle.y.value = withTiming(endY, {
    duration: particle.lifetime,
    easing: Easing.out(Easing.quad),
  });

  particle.scale.value = withSequence(
    withTiming(1, {
      duration: particle.lifetime * 0.2,
      easing: Easing.out(Easing.back(1.5)),
    }),
    withTiming(0.8, {
      duration: particle.lifetime * 0.6,
      easing: Easing.inOut(Easing.ease),
    }),
    withTiming(0, {
      duration: particle.lifetime * 0.2,
      easing: Easing.in(Easing.ease),
    })
  );

  particle.opacity.value = withSequence(
    withTiming(1, {
      duration: particle.lifetime * 0.1,
      easing: Easing.out(Easing.ease),
    }),
    withTiming(0.9, {
      duration: particle.lifetime * 0.7,
      easing: Easing.inOut(Easing.ease),
    }),
    withTiming(0, {
      duration: particle.lifetime * 0.2,
      easing: Easing.in(Easing.ease),
    })
  );

  particle.rotation.value = withTiming(particle.rotationTarget, {
    duration: particle.lifetime,
    easing: Easing.linear,
  });
}

/**
 * Helper function to create a Particle from ParticleData with SharedValues
 * This should be called in a React hook or component, not in callbacks
 */
export function createParticleFromData(
  data: ParticleData,
  createSharedValue: (value: number) => SharedValue<number>
): Particle {
  return {
    id: data.id,
    x: createSharedValue(data.startX),
    y: createSharedValue(data.startY),
    scale: createSharedValue(0),
    opacity: createSharedValue(1),
    rotation: createSharedValue(0),
    vx: data.vx,
    vy: data.vy,
    color: data.color,
    size: data.size,
    lifetime: data.lifetime,
    createdAt: data.createdAt,
    rotationTarget: data.rotationTarget,
  };
}
