/**
 * Telemetry System for Chat Effects
 *
 * Logs effect events with metadata: duration, dropped frames, deviceHz, reducedMotion, success.
 * Flags effects with >2 dropped frames in a 300ms window.
 *
 * Location: apps/web/src/effects/chat/core/telemetry.ts
 */

import { createLogger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';
import { hz } from '@/lib/refresh-rate';
import { random } from './seeded-rng';

const logger = createLogger('effect-telemetry');

/**
 * Device refresh rate type
 */
export type DeviceHz = 60 | 120 | 240;

/**
 * Effect name type
 */
export type EffectName =
  | 'send-warp'
  | 'receive-air-cushion'
  | 'typing-dots'
  | 'reaction-burst'
  | 'status-ticks'
  | 'swipe-reply-elastic'
  | 'reply-ribbon'
  | 'glass-morph-zoom'
  | 'sticker-physics'
  | 'scroll-fab-magnetic'
  | 'confetti-match'
  | 'match-confetti'
  | 'voice-wave'
  | 'link-preview'
  | 'presence-aurora';

/**
 * Effect event metadata
 */
export interface EffectEventMetadata {
  effect: EffectName;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  droppedFrames?: number;
  deviceHz?: DeviceHz;
  reducedMotion?: boolean;
  success?: boolean;
  error?: Error;
  [key: string]: unknown;
}

/**
 * Active effect tracking
 */
interface ActiveEffect {
  effect: EffectName;
  startedAt: number;
  metadata: Partial<EffectEventMetadata>;
}

const activeEffects = new Map<string, ActiveEffect>();

/**
 * Detect device refresh rate
 *
 * Uses requestAnimationFrame to detect actual refresh rate.
 * Falls back to heuristic if detection is not available.
 */
function detectDeviceHz(): DeviceHz {
  if (typeof window === 'undefined') {
    return 60;
  }

  try {
    const detectedHz = hz();
    // Clamp to valid DeviceHz values (60, 120, or 240)
    if (detectedHz >= 240) {
      return 240;
    }
    if (detectedHz >= 120) {
      return 120;
    }
    return 60;
  } catch {
    // Fallback: Check if device supports high refresh rate (common on modern phones/tablets)
    // This is a heuristic - actual detection requires frame timing API
    const isHighRefreshRate = window.devicePixelRatio >= 2 && 'ontouchstart' in window;
    return isHighRefreshRate ? 120 : 60;
  }
}

/**
 * Start tracking an effect
 *
 * @param effect - Effect name
 * @param metadata - Additional metadata
 * @returns Effect ID for tracking
 */
export function logEffectStart(
  effect: EffectName,
  metadata: Partial<EffectEventMetadata> = {}
): string {
  const effectId = `${effect}-${Date.now()}-${random().toString(36).substring(2, 9)}`;
  const startedAt = Date.now();

  const activeEffect: ActiveEffect = {
    effect,
    startedAt,
    metadata: {
      ...metadata,
      effect,
      startedAt,
      deviceHz: detectDeviceHz(),
    },
  };

  activeEffects.set(effectId, activeEffect);

  // Track analytics event (only string/number/boolean values)
  const analyticsMetadata: Record<string, string | number | boolean> = {
    effect,
    startedAt: startedAt.toString(),
  };

  // Add metadata that's compatible with analytics
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && value !== null && key !== 'error') {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        analyticsMetadata[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        analyticsMetadata[key] = JSON.stringify(value);
      } else {
        analyticsMetadata[key] = value === null || value === undefined ? '' : String(value as string | number | boolean);
      }
    }
  }

  analytics.track('effect_start', analyticsMetadata);

  logger.debug('Effect started', { effect, effectId, startedAt });

  return effectId;
}

/**
 * End tracking an effect
 *
 * @param effectId - Effect ID from logEffectStart
 * @param metadata - Additional metadata
 */
export function logEffectEnd(effectId: string, metadata: Partial<EffectEventMetadata> = {}): void {
  const activeEffect = activeEffects.get(effectId);

  if (!activeEffect) {
    logger.warn('Effect end called for unknown effect', { effectId });
    return;
  }

  const endedAt = Date.now();
  const durationMs = endedAt - activeEffect.startedAt;

  const finalMetadata: EffectEventMetadata = {
    effect: activeEffect.effect,
    startedAt: activeEffect.startedAt,
    ...activeEffect.metadata,
    ...metadata,
    endedAt,
    durationMs,
  };

  // Remove from active effects
  activeEffects.delete(effectId);

  // Check for dropped frames threshold (>2% drop rate or >2 frames in 300ms window)
  const droppedFrames = finalMetadata.droppedFrames ?? 0;
  const deviceHz = finalMetadata.deviceHz ?? 60;
  const frameBudget = 1000 / deviceHz; // ms per frame
  const expectedFrames = Math.ceil(durationMs / frameBudget);
  const dropRate = expectedFrames > 0 ? (droppedFrames / expectedFrames) * 100 : 0;

  // Threshold: >2 frames in window OR >2% drop rate
  if (droppedFrames > 2 || dropRate > 2) {
    logger.warn('Effect exceeded dropped frame threshold', {
      effect: finalMetadata.effect,
      droppedFrames,
      dropRate: dropRate.toFixed(2),
      durationMs,
      expectedFrames,
      frameBudget: frameBudget.toFixed(2),
      deviceHz,
      threshold: 2,
    });

    // Track as performance issue with device context
    analytics.track('effect_performance_issue', {
      effect: finalMetadata.effect,
      droppedFrames: droppedFrames.toString(),
      dropRate: dropRate.toFixed(2),
      durationMs: durationMs.toString(),
      deviceHz: deviceHz.toString(),
      frameBudget: frameBudget.toFixed(2),
      threshold: '2',
    });
  }

  // Track analytics event (only string/number/boolean values)
  analytics.track('effect_end', {
    effect: finalMetadata.effect,
    startedAt: finalMetadata.startedAt.toString(),
    endedAt: endedAt.toString(),
    durationMs: durationMs.toString(),
    droppedFrames: droppedFrames.toString(),
    dropRate: dropRate.toFixed(2),
    deviceHz: deviceHz.toString(),
    frameBudget: frameBudget.toFixed(2),
    success: finalMetadata.success?.toString() ?? 'true',
  });

  logger.debug('Effect ended', {
    effect: finalMetadata.effect,
    effectId,
    durationMs,
    droppedFrames,
    success: finalMetadata.success,
  });
}

/**
 * Update effect metadata while it's running
 */
export function updateEffectMetadata(
  effectId: string,
  metadata: Partial<EffectEventMetadata>
): void {
  const activeEffect = activeEffects.get(effectId);

  if (!activeEffect) {
    logger.warn('Update metadata called for unknown effect', { effectId });
    return;
  }

  activeEffect.metadata = {
    ...activeEffect.metadata,
    ...metadata,
  };
}

/**
 * Log effect error
 */
export function logEffectError(
  effectId: string,
  error: Error,
  metadata: Partial<EffectEventMetadata> = {}
): void {
  const activeEffect = activeEffects.get(effectId);

  if (!activeEffect) {
    logger.warn('Effect error called for unknown effect', { effectId });
    return;
  }

  const endedAt = Date.now();
  const durationMs = endedAt - activeEffect.startedAt;

  const finalMetadata: EffectEventMetadata = {
    effect: activeEffect.effect,
    startedAt: activeEffect.startedAt,
    ...activeEffect.metadata,
    ...metadata,
    endedAt,
    durationMs,
    success: false,
    error,
  };

  // Remove from active effects
  activeEffects.delete(effectId);

  // Track error
  analytics.track('effect_error', {
    effect: finalMetadata.effect,
    error: error.message,
    durationMs: durationMs.toString(),
  });

  logger.error('Effect error', error, {
    effect: finalMetadata.effect,
    effectId,
    durationMs,
  });
}

/**
 * Get active effects count
 */
export function getActiveEffectsCount(): number {
  return activeEffects.size;
}

/**
 * Clear all active effects (for testing)
 */
export function clearActiveEffects(): void {
  activeEffects.clear();
}

/**
 * Track frame drop for an effect
 * Automatically reduces effect quality if frame drops exceed threshold
 */
export function trackFrameDrop(
  effectId: string,
  frameTime: number,
  deviceHz: DeviceHz
): void {
  const activeEffect = activeEffects.get(effectId);
  if (!activeEffect) {
    return;
  }

  const frameBudget = 1000 / deviceHz;
  const isDropped = frameTime > frameBudget * 1.5; // 50% margin

  if (isDropped) {
    const currentDrops = (activeEffect.metadata.droppedFrames!) ?? 0;
    activeEffect.metadata.droppedFrames = currentDrops + 1;

    // Auto-reduce quality if >2% drop rate
    const duration = Date.now() - activeEffect.startedAt;
    const expectedFrames = Math.ceil(duration / frameBudget);
    const dropRate = expectedFrames > 0 ? ((currentDrops + 1) / expectedFrames) * 100 : 0;

    if (dropRate > 2) {
      logger.warn('Auto-reducing effect quality due to frame drops', {
        effect: activeEffect.effect,
        effectId,
        dropRate: dropRate.toFixed(2),
        deviceHz,
      });

      // Dispatch event for effect quality reduction
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('effect-quality-reduction', {
            detail: {
              effectId,
              effect: activeEffect.effect,
              dropRate,
              deviceHz,
            },
          })
        );
      }
    }
  }
}

/**
 * Get performance summary for all active effects
 */
export function getPerformanceSummary(): {
  activeCount: number;
  totalDroppedFrames: number;
  averageDropRate: number;
  effects: {
    effect: EffectName;
    duration: number;
    droppedFrames: number;
    dropRate: number;
  }[];
} {
  const effects = Array.from(activeEffects.values());
  const now = Date.now();
  let totalDroppedFrames = 0;
  let totalExpectedFrames = 0;

  const effectSummaries = effects.map((activeEffect) => {
    const duration = now - activeEffect.startedAt;
    const deviceHz = (activeEffect.metadata.deviceHz!) ?? 60;
    const frameBudget = 1000 / deviceHz;
    const expectedFrames = Math.ceil(duration / frameBudget);
    const droppedFrames = (activeEffect.metadata.droppedFrames!) ?? 0;
    const dropRate = expectedFrames > 0 ? (droppedFrames / expectedFrames) * 100 : 0;

    totalDroppedFrames += droppedFrames;
    totalExpectedFrames += expectedFrames;

    return {
      effect: activeEffect.effect,
      duration,
      droppedFrames,
      dropRate,
    };
  });

  const averageDropRate =
    totalExpectedFrames > 0 ? (totalDroppedFrames / totalExpectedFrames) * 100 : 0;

  return {
    activeCount: effects.length,
    totalDroppedFrames,
    averageDropRate,
    effects: effectSummaries,
  };
}
