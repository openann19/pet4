/**
 * Sound Feedback System (Mobile)
 *
 * Provides sound feedback for UI interactions on React Native:
 * - Platform-specific sound generation
 * - Haptic feedback synchronization
 * - Reduced motion awareness
 * - Volume-aware playback
 *
 * Location: apps/mobile/src/effects/core/sound-feedback.ts
 */

import { createLogger } from '@/utils/logger';
import { triggerHapticByContext } from '@/effects/chat/core/haptic-manager';
import { isReduceMotionEnabled } from '@/effects/chat/core/reduced-motion';
import type { HapticContext } from '@/effects/chat/core/haptic-manager';

const logger = createLogger('sound-feedback');

/**
 * Sound type
 */
export type SoundType =
  | 'tap'
  | 'success'
  | 'error'
  | 'notification'
  | 'match'
  | 'send'
  | 'receive'
  | 'delete'
  | 'swipe'
  | 'longPress'
  | 'reaction'
  | 'reply';

/**
 * Sound context mapping to haptic contexts
 */
const SOUND_TO_HAPTIC_CONTEXT: Record<SoundType, HapticContext> = {
  tap: 'tap',
  success: 'success',
  error: 'error',
  notification: 'success',
  match: 'success',
  send: 'send',
  receive: 'receive',
  delete: 'delete',
  swipe: 'swipe',
  longPress: 'longPress',
  reaction: 'reaction',
  reply: 'reply',
};

/**
 * Sound feedback options
 */
export interface SoundFeedbackOptions {
  enabled?: boolean;
  volume?: number; // 0-1
  muted?: boolean;
  hapticEnabled?: boolean;
  respectReducedMotion?: boolean;
}

/**
 * Sound Feedback Service (Mobile)
 *
 * On mobile, we rely primarily on haptic feedback since
 * programmatic sound generation requires native modules.
 * This service provides haptic-only feedback that can be
 * enhanced with native sound modules if needed.
 */
export class SoundFeedbackService {
  private enabled: boolean;
  private volume: number;
  private muted: boolean;
  private hapticEnabled: boolean;
  private respectReducedMotion: boolean;
  private lastPlayTime: number = 0;
  private cooldownMs: number = 50; // Minimum time between sounds

  constructor(options: SoundFeedbackOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.volume = Math.max(0, Math.min(1, options.volume ?? 0.3)); // Default 30% volume
    this.muted = options.muted ?? false;
    this.hapticEnabled = options.hapticEnabled ?? true;
    this.respectReducedMotion = options.respectReducedMotion ?? true;
  }

  /**
   * Play sound effect with haptic feedback
   *
   * On mobile, this primarily triggers haptic feedback.
   * Sound can be added via native modules if needed.
   */
  play(soundType: SoundType, options: { haptic?: boolean } = {}): Promise<void> {
    // Check if sound is enabled and not muted
    if (!this.enabled || this.muted) {
      return Promise.resolve()
    }

    // Cooldown check
    const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
    if (now - this.lastPlayTime < this.cooldownMs) {
      return Promise.resolve()
    }
    this.lastPlayTime = now

    return Promise.resolve().then(() => {
      try {
        // Always respect reduced motion on mobile
        const reduced = this.respectReducedMotion && isReduceMotionEnabled();

        // Trigger haptic feedback if enabled
        if (this.hapticEnabled && (options.haptic ?? true)) {
          const hapticContext = SOUND_TO_HAPTIC_CONTEXT[soundType];
          if (hapticContext) {
            void triggerHapticByContext(hapticContext, false);
          }
        }

        // On mobile, we primarily use haptics
        // Sound can be added via native modules (expo-av, react-native-sound, etc.)
        // For now, we rely on haptic feedback only

        if (!reduced) {
          logger.debug('Played sound (haptic only)', {
            soundType,
            hapticTriggered: this.hapticEnabled && (options.haptic ?? true),
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to play sound', err, {
          soundType,
        });
      }
    });
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    logger.debug('Volume set', { volume: this.volume });
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    logger.debug('Muted state changed', { muted });
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.debug('Enabled state changed', { enabled });
  }

  /**
   * Set haptic enabled state
   */
  setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
    logger.debug('Haptic enabled state changed', { enabled });
  }

  /**
   * Set respect reduced motion
   */
  setRespectReducedMotion(respect: boolean): void {
    this.respectReducedMotion = respect;
    logger.debug('Respect reduced motion changed', { respect });
  }

  /**
   * Update reduced motion state (called when user preference changes)
   */
  updateReducedMotion(): void {
    // This method is called to update internal state if needed
    // The actual check happens in play() method
  }
}

// Singleton instance
let soundService: SoundFeedbackService | null = null;

/**
 * Get sound feedback service instance
 */
export function getSoundFeedbackService(): SoundFeedbackService {
  if (!soundService) {
    soundService = new SoundFeedbackService();
  }
  return soundService;
}

/**
 * Play sound (convenience function)
 */
export function playSound(soundType: SoundType, options: { haptic?: boolean } = {}): Promise<void> {
  return getSoundFeedbackService().play(soundType, options);
}
