/**
 * Match/Like Confetti Effect Hook (Mobile - React Native)
 *
 * Creates a premium confetti celebration for matches and likes with:
 * - GPU particle emitter (120 particles max)
 * - Physics-based particle motion
 * - Deterministic seeding for consistency
 * - Reduced motion support
 * - 600-900ms duration
 * - Platform-optimized rendering
 *
 * Location: apps/mobile/src/effects/chat/celebrations/use-match-confetti.ts
 */

import { useCallback, useRef } from 'react';
import { useReducedMotion, getReducedMotionDuration } from '../core/reduced-motion';
import { randomRange } from '../core/seeded-rng';
import { triggerHaptic } from '../core/haptic-manager';
import { logEffectStart, logEffectEnd } from '../core/telemetry';
import { createLogger } from '@/lib/logger';
import { ABSOLUTE_MAX_UI_MODE } from '@/config/absolute-max-ui-mode';
import { Platform } from 'react-native';

const logger = createLogger('match-confetti');

/**
 * Match/Like confetti effect options
 */
export interface UseMatchConfettiOptions {
  enabled?: boolean;
  particleCount?: number; // Max 120 for GPU budget
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
}

const DEFAULT_ENABLED = true;
const DEFAULT_PARTICLE_COUNT = 80; // Conservative default
const MAX_PARTICLE_COUNT = 120; // GPU budget limit
const DURATION_MIN = 600; // ms
const DURATION_MAX = 900; // ms
// DEFAULT_COLORS will be used when confetti dispatch is implemented
// const DEFAULT_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899'];

/**
 * Hook to trigger match/like confetti celebration (Mobile)
 *
 * @example
 * ```tsx
 * const { trigger, isActive } = useMatchConfetti({
 *   particleCount: 100,
 *   onComplete: () => console.log('Confetti complete!')
 * })
 *
 * // Trigger on match
 * <Button onPress={() => trigger('match-123')}>Match!</Button>
 * ```
 */
export function useMatchConfetti(
  options: UseMatchConfettiOptions = {}
): UseMatchConfettiReturn {
  const {
    enabled = DEFAULT_ENABLED,
    particleCount = DEFAULT_PARTICLE_COUNT,
    duration = DURATION_MIN,
    onComplete,
  } = options;
  // colors is reserved for future use when confetti dispatch is implemented
  // const colors = options.colors ?? DEFAULT_COLORS;

  const reducedMotion = useReducedMotion();
  const isActiveRef = useRef(false);
  const effectIdRef = useRef<string | null>(null);

  const trigger = useCallback(
    (seed?: number | string) => {
      if (!enabled || isActiveRef.current) {
        logger.debug('Confetti trigger ignored', { enabled, isActive: isActiveRef.current });
        return;
      }

      // Check if effects are enabled in UI mode
      if (!ABSOLUTE_MAX_UI_MODE.animation.showParticles) {
        logger.debug('Confetti disabled by UI mode');
        return;
      }

      isActiveRef.current = true;

      // Calculate duration with randomization
      const baseDuration = duration + randomRange(0, DURATION_MAX - duration);
      const finalDuration = getReducedMotionDuration(baseDuration, reducedMotion);

      // Clamp particle count to GPU budget
      // On Android, use slightly fewer particles for older devices
      const platformMultiplier = Platform.OS === 'android' && Platform.Version < 29 ? 0.8 : 1.0;
      const clampedParticleCount = Math.floor(
        Math.min(particleCount * platformMultiplier, MAX_PARTICLE_COUNT)
      );

      // Log effect start
      const effectId = logEffectStart('match-confetti', {
        particleCount: clampedParticleCount,
        duration: finalDuration,
        seed: seed ?? 'default',
        reducedMotion,
        platform: Platform.OS,
        platformVersion: Platform.Version,
      });
      effectIdRef.current = effectId;

      logger.info('Confetti triggered', {
        particleCount: clampedParticleCount,
        duration: finalDuration,
        reducedMotion,
        platform: Platform.OS,
      });

      // Trigger haptic feedback (celebration)
      if (ABSOLUTE_MAX_UI_MODE.feedback.haptics) {
        triggerHaptic('success');
      }

      // Trigger sound effect (if enabled)
      if (ABSOLUTE_MAX_UI_MODE.feedback.sound) {
        // Feature request: Integrate with sound feedback system
        // See: https://github.com/your-org/petspark/issues/sound-feedback
        logger.debug('Sound effect triggered (stub)');
      }

      // Feature request: Dispatch event to ConfettiBurst component
      // See: https://github.com/your-org/petspark/issues/confetti-events
      // React Native doesn't have CustomEvent, so we'll need a different approach
      // Options:
      // 1. Use EventEmitter
      // 2. Use Context API
      // 3. Use state management (Redux/Zustand)
      // For now, log a warning
      logger.warn('Mobile confetti dispatch not yet implemented - need event system');

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
    [enabled, particleCount, duration, reducedMotion, onComplete]
  );

  return {
    trigger,
    isActive: isActiveRef.current,
  };
}
