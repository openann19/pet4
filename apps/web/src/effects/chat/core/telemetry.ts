/**
 * Telemetry System for Chat Effects
 * 
 * Logs effect events with metadata: duration, dropped frames, deviceHz, reducedMotion, success.
 * Flags effects with >2 dropped frames in a 300ms window.
 * 
 * Location: apps/web/src/effects/chat/core/telemetry.ts
 */

import { createLogger } from '@/lib/logger'
import { analytics } from '@/lib/analytics'
import { random } from './seeded-rng'

const logger = createLogger('effect-telemetry')

/**
 * Device refresh rate type
 */
export type DeviceHz = 60 | 120

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
  | 'glass-morph-zoom'
  | 'sticker-physics'
  | 'scroll-fab-magnetic'
  | 'confetti-match'
  | 'voice-wave'
  | 'link-preview'
  | 'presence-aurora'

/**
 * Effect event metadata
 */
export interface EffectEventMetadata {
  effect: EffectName
  startedAt: number
  endedAt?: number
  durationMs?: number
  droppedFrames?: number
  deviceHz?: DeviceHz
  reducedMotion?: boolean
  success?: boolean
  error?: Error
  [key: string]: unknown
}

/**
 * Active effect tracking
 */
interface ActiveEffect {
  effect: EffectName
  startedAt: number
  metadata: Partial<EffectEventMetadata>
}

const activeEffects = new Map<string, ActiveEffect>()

/**
 * Detect device refresh rate
 */
function detectDeviceHz(): DeviceHz {
  if (typeof window === 'undefined') {
    return 60
  }

  // Check if device supports 120Hz (common on modern phones/tablets)
  // This is a heuristic - actual detection requires frame timing API
  const isHighRefreshRate = window.devicePixelRatio >= 2 && 
    'ontouchstart' in window

  return isHighRefreshRate ? 120 : 60
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
  const effectId = `${effect}-${Date.now()}-${random().toString(36).substring(2, 9)}`
  const startedAt = Date.now()

  const activeEffect: ActiveEffect = {
    effect,
    startedAt,
    metadata: {
      ...metadata,
      effect,
      startedAt,
      deviceHz: detectDeviceHz(),
    },
  }

  activeEffects.set(effectId, activeEffect)

  // Track analytics event
  analytics.track('effect_start', {
    effect,
    startedAt: startedAt.toString(),
    ...metadata,
  })

  logger.debug('Effect started', { effect, effectId, startedAt })

  return effectId
}

/**
 * End tracking an effect
 * 
 * @param effectId - Effect ID from logEffectStart
 * @param metadata - Additional metadata
 */
export function logEffectEnd(
  effectId: string,
  metadata: Partial<EffectEventMetadata> = {}
): void {
  const activeEffect = activeEffects.get(effectId)

  if (!activeEffect) {
    logger.warn('Effect end called for unknown effect', { effectId })
    return
  }

  const endedAt = Date.now()
  const durationMs = endedAt - activeEffect.startedAt

  const finalMetadata: EffectEventMetadata = {
    effect: activeEffect.effect,
    startedAt: activeEffect.startedAt,
    ...activeEffect.metadata,
    ...metadata,
    endedAt,
    durationMs,
  }

  // Remove from active effects
  activeEffects.delete(effectId)

  // Check for dropped frames threshold (>2 in 300ms window)
  const droppedFrames = finalMetadata.droppedFrames ?? 0
  if (droppedFrames > 2) {
    logger.warn('Effect exceeded dropped frame threshold', {
      effect: finalMetadata.effect,
      droppedFrames,
      durationMs,
      threshold: 2,
    })

    // Track as performance issue
    analytics.track('effect_performance_issue', {
      effect: finalMetadata.effect,
      droppedFrames: droppedFrames.toString(),
      durationMs: durationMs.toString(),
      threshold: '2',
    })
  }

  // Track analytics event
  analytics.track('effect_end', {
    effect: finalMetadata.effect,
    startedAt: finalMetadata.startedAt.toString(),
    endedAt: endedAt.toString(),
    durationMs: durationMs.toString(),
    droppedFrames: droppedFrames.toString(),
    success: finalMetadata.success?.toString() ?? 'true',
  })

  logger.debug('Effect ended', {
    effect: finalMetadata.effect,
    effectId,
    durationMs,
    droppedFrames,
    success: finalMetadata.success,
  })
}

/**
 * Update effect metadata while it's running
 */
export function updateEffectMetadata(
  effectId: string,
  metadata: Partial<EffectEventMetadata>
): void {
  const activeEffect = activeEffects.get(effectId)

  if (!activeEffect) {
    logger.warn('Update metadata called for unknown effect', { effectId })
    return
  }

  activeEffect.metadata = {
    ...activeEffect.metadata,
    ...metadata,
  }
}

/**
 * Log effect error
 */
export function logEffectError(
  effectId: string,
  error: Error,
  metadata: Partial<EffectEventMetadata> = {}
): void {
  const activeEffect = activeEffects.get(effectId)

  if (!activeEffect) {
    logger.warn('Effect error called for unknown effect', { effectId })
    return
  }

  const endedAt = Date.now()
  const durationMs = endedAt - activeEffect.startedAt

  const finalMetadata: EffectEventMetadata = {
    effect: activeEffect.effect,
    startedAt: activeEffect.startedAt,
    ...activeEffect.metadata,
    ...metadata,
    endedAt,
    durationMs,
    success: false,
    error,
  }

  // Remove from active effects
  activeEffects.delete(effectId)

  // Track error
  analytics.track('effect_error', {
    effect: finalMetadata.effect,
    error: error.message,
    durationMs: durationMs.toString(),
  })

  logger.error('Effect error', error, {
    effect: finalMetadata.effect,
    effectId,
    durationMs,
  })
}

/**
 * Get active effects count
 */
export function getActiveEffectsCount(): number {
  return activeEffects.size
}

/**
 * Clear all active effects (for testing)
 */
export function clearActiveEffects(): void {
  activeEffects.clear()
}

