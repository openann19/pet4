'use client';

import { useCallback } from 'react';
import { spawnParticles, type ParticleConfig } from '@/effects/reanimated/particle-engine';

export type ParticleEventType = 'send' | 'delete' | 'reaction' | 'ai-reply';

export interface UseParticleBurstOnEventOptions {
  enabled?: boolean;
  onBurst?: (type: ParticleEventType, x: number, y: number) => void;
}

export interface UseParticleBurstOnEventReturn {
  triggerBurst: (type: ParticleEventType, x: number, y: number, emoji?: string) => void;
}

const DEFAULT_ENABLED = true;

const EVENT_CONFIGS: Record<ParticleEventType, Partial<ParticleConfig>> = {
  send: {
    count: 12,
    colors: ['hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--success))'],
    minSize: 4,
    maxSize: 10,
    minLifetime: 500,
    maxLifetime: 800,
    minVelocity: 150,
    maxVelocity: 300,
    gravity: 0.3,
    friction: 0.98,
    spread: 360,
  },
  delete: {
    count: 8,
    colors: ['hsl(var(--destructive))', 'hsl(var(--destructive) / 0.8)'],
    minSize: 6,
    maxSize: 14,
    minLifetime: 400,
    maxLifetime: 600,
    minVelocity: 200,
    maxVelocity: 400,
    gravity: 0.5,
    friction: 0.97,
    spread: 360,
  },
  reaction: {
    count: 6,
    colors: ['hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--accent))'],
    minSize: 8,
    maxSize: 16,
    minLifetime: 600,
    maxLifetime: 1000,
    minVelocity: 100,
    maxVelocity: 250,
    gravity: 0.2,
    friction: 0.99,
    spread: 180,
  },
  'ai-reply': {
    count: 10,
    colors: ['hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--primary))'],
    minSize: 5,
    maxSize: 12,
    minLifetime: 700,
    maxLifetime: 1200,
    minVelocity: 120,
    maxVelocity: 280,
    gravity: 0.25,
    friction: 0.98,
    spread: 360,
  },
};

export function useParticleBurstOnEvent(
  options: UseParticleBurstOnEventOptions = {}
): UseParticleBurstOnEventReturn {
  const { enabled = DEFAULT_ENABLED, onBurst } = options;

  const triggerBurst = useCallback(
    (type: ParticleEventType, x: number, y: number, _emoji?: string) => {
      if (!enabled) {
        return;
      }

      const config = EVENT_CONFIGS[type] ?? EVENT_CONFIGS.send;
      const particles = spawnParticles(x, y, config as ParticleConfig);

      if (onBurst) {
        onBurst(type, x, y);
      }

      return particles;
    },
    [enabled, onBurst]
  );

  return {
    triggerBurst,
  };
}
