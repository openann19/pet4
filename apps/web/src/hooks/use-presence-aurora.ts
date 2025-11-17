/**
 * Presence Aurora Hook — Shared Logic
 *
 * Shared logic for presence aurora ring animations.
 * Used by both web and mobile implementations.
 */

import { useMemo } from 'react';
import { useSharedValue, withTiming, withRepeat } from '@petspark/motion';

export interface UsePresenceAuroraOptions {
  status: 'online' | 'away' | 'busy' | 'offline';
  intensity?: number;
  pulseRate?: number;
  reduced?: boolean;
}

export interface UsePresenceAuroraReturn {
  rotation: ReturnType<typeof useSharedValue<number>>;
  opacity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Get reduced motion duration
 */
function getReducedMotionDuration(duration: number, reduced: boolean): number {
  return reduced ? Math.min(duration, 120) : duration;
}

/**
 * Presence Aurora Hook
 *
 * @example
 * ```typescript
 * const { rotation, opacity } = usePresenceAurora({
 *   status: 'online',
 *   intensity: 0.8,
 *   pulseRate: 3600,
 *   reduced: false,
 * });
 * ```
 */
export function usePresenceAurora({
  status,
  intensity = 0.8,
  pulseRate = 3600,
  reduced = false,
}: UsePresenceAuroraOptions): UsePresenceAuroraReturn {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(status === 'offline' ? 0 : intensity);

  const dur = getReducedMotionDuration(pulseRate, reduced);

  useMemo(() => {
    rotation.value = 0;
    opacity.value = status === 'offline' ? 0 : intensity;

    if (!reduced && status !== 'offline') {
      rotation.value = withRepeat(withTiming(360, { duration: dur }), -1, false);
      opacity.value = withRepeat(
        withTiming(intensity, { duration: dur / 2 }),
        -1,
        true
      );
    }
  }, [reduced, status, dur, rotation, opacity, intensity]);

  return {
    rotation,
    opacity,
  };
}
