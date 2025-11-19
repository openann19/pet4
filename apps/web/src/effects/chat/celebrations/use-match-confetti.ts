/**
 * Match/Like Confetti Effect Hook (Web)
 *
 * Creates a premium confetti celebration for matches and likes with:
 * - GPU particle emitter (120 particles max)
 * - Physics-based particle motion
 * - Deterministic seeding for consistency
 * - Reduced motion support
 * - 600-900ms duration
 *
 * Location: apps/web/src/effects/chat/celebrations/use-match-confetti.ts
 */

import { useCallback, useRef } from 'react';
import { type SharedValue } from '@petspark/motion';
import { useReducedMotion, getReducedMotionDuration } from '../core/reduced-motion';
import { createSeededRNG, randomRange } from '../core/seeded-rng';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectStart, logEffectEnd } from '../core/telemetry';
import { createLogger } from '@/lib/logger';
import { useUIConfig } from '@/hooks/use-ui-config';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';

const logger = createLogger('match-confetti');

/**
 * Match/Like confetti effect options
 */
export interface UseMatchConfettiOptions {
  enabled?: boolean;
  particleCount?: number; // Auto-adjusted based on device capability
  colors?: string[];
  duration?: number; // 600-900ms
  onComplete?: () => void;
}

/**
 * Match/Like confetti effect return type
 */
export interface UseMatchConfettiReturn {
  trigger: (seed?: number | string) => void;
  isActive: boolean;
  particleCount: number; // Actual particle count (device-aware)
}

const DEFAULT_ENABLED = true;
const DEFAULT_PARTICLE_COUNT = 80; // Base default (will be adjusted by device)
const DURATION_MIN = 600; // ms
const DURATION_MAX = 900; // ms
const DEFAULT_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899'];

/**
 * Hook to trigger match/like confetti celebration
 *
 * @example
 * ```tsx
 * const { trigger, isActive } = useMatchConfetti({
 *   particleCount: 100,
 *   onComplete: () => logger.info('Confetti complete!')
 * })
 *
 * // Trigger on match
 * <button onClick={() => trigger('match-123')}>Match!</button>
 * ```
 */
export function useMatchConfetti(
  options: UseMatchConfettiOptions = {}
): UseMatchConfettiReturn {
  const {
    enabled = DEFAULT_ENABLED,
    particleCount: requestedParticleCount = DEFAULT_PARTICLE_COUNT,
    colors = DEFAULT_COLORS,
    duration = DURATION_MIN,
    onComplete,
  } = options;

  const reducedMotion = useReducedMotion();
  const { animation, feedback } = useUIConfig();
  const { deviceCapability, hz } = useDeviceRefreshRate();
  const isActiveRef = useRef(false);
  const effectIdRef = useRef<string | null>(null);

  // Calculate device-aware particle count
  // Use device capability maxParticles, but allow override if requested is lower
  const actualParticleCount = Math.min(
    requestedParticleCount,
    deviceCapability.maxParticles
  );

  const trigger = useCallback(
    (seed?: number | string) => {
      if (!enabled || isActiveRef.current) {
        logger.debug('Confetti trigger ignored', { enabled, isActive: isActiveRef.current });
        return;
      }

      // Check if effects are enabled in UI mode
      if (!animation.showParticles) {
        logger.debug('Confetti disabled by UI mode');
        return;
      }

      // Check device capability
      if (!deviceCapability.supportsAdvancedEffects) {
        logger.debug('Confetti disabled - device does not support advanced effects');
        return;
      }

      isActiveRef.current = true;

      // Calculate duration with randomization and device-aware scaling
      const baseDuration = duration + randomRange(0, DURATION_MAX - duration);
      const finalDuration = getReducedMotionDuration(baseDuration, reducedMotion);

      // Use device-aware particle count
      const clampedParticleCount = actualParticleCount;

      // Log effect start with device info
      const deviceHz: 60 | 120 | 240 = hz >= 240 ? 240 : hz >= 120 ? 120 : 60
      const effectId = logEffectStart('match-confetti', {
        particleCount: clampedParticleCount,
        duration: finalDuration,
        seed: seed ?? 'default',
        reducedMotion,
        deviceHz,
        deviceCapability: deviceCapability.isHighEnd ? 'high-end' : deviceCapability.isMidRange ? 'mid-range' : 'low-end',
      });
      effectIdRef.current = effectId;

      logger.info('Confetti triggered', {
        particleCount: clampedParticleCount,
        duration: finalDuration,
        reducedMotion,
        deviceHz: hz,
        maxParticles: deviceCapability.maxParticles,
        deviceCapability: deviceCapability.isHighEnd ? 'high-end' : deviceCapability.isMidRange ? 'mid-range' : 'low-end',
      });

      // Trigger haptic feedback (celebration)
      if (feedback.haptics) {
        triggerHaptic('success');
      }

      // Trigger sound effect (if enabled)
      if (feedback.sound) {
        // Feature request: Integrate with sound feedback system
        // See: https://github.com/your-org/petspark/issues/sound-feedback
        logger.debug('Sound effect triggered (stub)');
      }

      // Dispatch custom event to trigger ConfettiBurst component
      const event = new CustomEvent('match-confetti-trigger', {
        detail: {
          particleCount: clampedParticleCount,
          colors,
          duration: finalDuration,
          seed: seed ?? Date.now().toString(),
        },
      });
      window.dispatchEvent(event);

      // Complete after duration
      setTimeout(() => {
        isActiveRef.current = false;

        // Call onComplete callback
        if (onComplete) {
          onComplete();
        }

        // Log effect end
        if (effectIdRef.current) {
          logEffectEnd(effectIdRef.current, {
            durationMs: finalDuration,
            success: true,
          });
          effectIdRef.current = null;
        }

        logger.info('Confetti complete', { duration: finalDuration });
      }, finalDuration);
    },
    [
      enabled,
      actualParticleCount,
      colors,
      duration,
      reducedMotion,
      animation,
      feedback,
      deviceCapability,
      hz,
      onComplete,
    ]
  );

  return {
    trigger,
    isActive: isActiveRef.current,
    particleCount: actualParticleCount,
  };
}
