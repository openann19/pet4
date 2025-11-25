/**
 * Sound Feedback System (Web)
 *
 * Provides volume-aware sound effects for UI interactions:
 * - Subtle UI ticks for actions
 * - Celebration sounds for matches
 * - Volume-aware playback
 * - User preference toggles
 * - Haptic feedback synchronization
 * - Reduced motion awareness
 *
 * Location: apps/web/src/effects/core/sound-feedback.ts
 */

import { createLogger } from '@/lib/logger';
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
 * Sound Feedback Service
 */
export class SoundFeedbackService {
  private enabled: boolean;
  private volume: number;
  private muted: boolean;
  private hapticEnabled: boolean;
  private respectReducedMotion: boolean;
  private audioContext: AudioContext | null = null;
  private soundCache = new Map<SoundType, AudioBuffer>();
  private lastPlayTime = 0;
  private cooldownMs = 50; // Minimum time between sounds

  constructor(options: SoundFeedbackOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.volume = Math.max(0, Math.min(1, options.volume ?? 0.3)); // Default 30% volume
    this.muted = options.muted ?? false;
    this.hapticEnabled = options.hapticEnabled ?? true;
    this.respectReducedMotion = options.respectReducedMotion ?? true;

    // Initialize audio context
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn('Failed to initialize AudioContext', err);
      }
    }
  }

  /**
   * Play sound effect with optional haptic feedback
   */
  async play(soundType: SoundType, options: { haptic?: boolean } = {}): Promise<void> {
    // Check if sound is enabled and not muted
    if (!this.enabled || this.muted || !this.audioContext) {
      return;
    }

    // Respect reduced motion
    if (this.respectReducedMotion && isReduceMotionEnabled()) {
      // Only trigger haptic if enabled, skip sound
      if (this.hapticEnabled && (options.haptic ?? true)) {
        const hapticContext = SOUND_TO_HAPTIC_CONTEXT[soundType];
        if (hapticContext) {
          triggerHapticByContext(hapticContext, false);
        }
      }
      return;
    }

    // Cooldown check
    const now =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    if (now - this.lastPlayTime < this.cooldownMs) {
      return;
    }
    this.lastPlayTime = now;

    try {
      // Trigger haptic feedback if enabled
      if (this.hapticEnabled && (options.haptic ?? true)) {
        const hapticContext = SOUND_TO_HAPTIC_CONTEXT[soundType];
        if (hapticContext) {
          triggerHapticByContext(hapticContext, false);
        }
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Get or generate sound buffer
      const buffer = await this.getSoundBuffer(soundType);
      if (!buffer) {
        return;
      }

      // Create buffer source
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = this.volume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play sound
      source.start(0);

      logger.debug('Played sound', {
        soundType,
        volume: this.volume,
        hapticTriggered: this.hapticEnabled && (options.haptic ?? true),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to play sound', err, {
        soundType,
      });
    }
  }

  /**
   * Get or generate sound buffer
   */
  private getSoundBuffer(soundType: SoundType): Promise<AudioBuffer | null> {
    // Check cache
    const cached = this.soundCache.get(soundType);
    if (cached) {
      return Promise.resolve(cached);
    }

    if (!this.audioContext) {
      return Promise.resolve(null);
    }

    // Generate sound buffer based on type
    const buffer = this.generateSound(soundType);
    if (buffer) {
      this.soundCache.set(soundType, buffer);
    }

    return Promise.resolve(buffer);
  }

  /**
   * Generate sound waveform
   */
  private generateSound(soundType: SoundType): AudioBuffer | null {
    if (!this.audioContext) {
      return null;
    }

    const sampleRate = this.audioContext.sampleRate;
    const duration = this.getSoundDuration(soundType);
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate waveform based on sound type
    switch (soundType) {
      case 'tap':
        // Short, high-pitched click
        this.generateClick(data, sampleRate, 0.01, 800);
        break;
      case 'success':
        // Rising tone
        this.generateRisingTone(data, sampleRate, duration);
        break;
      case 'error':
        // Low, descending tone
        this.generateDescendingTone(data, sampleRate, duration);
        break;
      case 'notification':
        // Pleasant chime
        this.generateChime(data, sampleRate, duration);
        break;
      case 'match':
        // Celebration chord
        this.generateCelebrationChord(data, sampleRate, duration);
        break;
      case 'send':
        // Whoosh sound
        this.generateWhoosh(data, sampleRate, duration);
        break;
      case 'receive':
        // Soft pop
        this.generatePop(data, sampleRate, duration);
        break;
      case 'delete':
        // Sharp click
        this.generateClick(data, sampleRate, duration, 400);
        break;
      case 'swipe':
        // Subtle swipe sound
        this.generateSwipe(data, sampleRate, duration);
        break;
      case 'longPress':
        // Haptic-like buzz
        this.generateBuzz(data, sampleRate, duration);
        break;
      case 'reaction':
        // Quick pop
        this.generatePop(data, sampleRate, 0.08);
        break;
      case 'reply':
        // Subtle whoosh
        this.generateWhoosh(data, sampleRate, 0.12);
        break;
    }

    return buffer;
  }

  /**
   * Get sound duration based on type
   */
  private getSoundDuration(soundType: SoundType): number {
    switch (soundType) {
      case 'tap':
        return 0.05; // 50ms
      case 'success':
        return 0.2; // 200ms
      case 'error':
        return 0.3; // 300ms
      case 'notification':
        return 0.25; // 250ms
      case 'match':
        return 0.6; // 600ms
      case 'send':
        return 0.15; // 150ms
      case 'receive':
        return 0.1; // 100ms
      case 'delete':
        return 0.08; // 80ms
      case 'swipe':
        return 0.12; // 120ms
      case 'longPress':
        return 0.2; // 200ms
      case 'reaction':
        return 0.08; // 80ms
      case 'reply':
        return 0.12; // 120ms
      default:
        return 0.1;
    }
  }

  /**
   * Generate click sound
   */
  private generateClick(
    data: Float32Array,
    sampleRate: number,
    duration: number,
    frequency: number
  ): void {
    const frameCount = data.length;
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const amplitude = Math.exp(-t * 30); // Exponential decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    }
  }

  /**
   * Generate rising tone
   */
  private generateRisingTone(data: Float32Array, sampleRate: number, duration: number): void {
    const frameCount = data.length;
    const startFreq = 400;
    const endFreq = 600;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      const amplitude = Math.sin(Math.PI * progress); // Fade in and out
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * 0.5;
    }
  }

  /**
   * Generate descending tone
   */
  private generateDescendingTone(data: Float32Array, sampleRate: number, duration: number): void {
    const frameCount = data.length;
    const startFreq = 300;
    const endFreq = 200;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      const amplitude = Math.sin(Math.PI * progress);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * 0.5;
    }
  }

  /**
   * Generate chime
   */
  private generateChime(data: Float32Array, sampleRate: number, duration: number): void {
    const frameCount = data.length;
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G chord

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      let sample = 0;

      for (const freq of frequencies) {
        const amplitude = Math.exp(-progress * 5); // Decay
        sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
      }

      data[i] = (sample / frequencies.length) * 0.3;
    }
  }

  /**
   * Generate celebration chord
   */
  private generateCelebrationChord(data: Float32Array, sampleRate: number, duration: number): void {
    const frameCount = data.length;
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C chord

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      let sample = 0;

      for (const freq of frequencies) {
        const amplitude = Math.exp(-progress * 3); // Slower decay
        sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
      }

      data[i] = (sample / frequencies.length) * 0.4;
    }
  }

  /**
   * Generate whoosh sound
   */
  private generateWhoosh(data: Float32Array, sampleRate: number, duration: number): void {
    const frameCount = data.length;
    const startFreq = 200;
    const endFreq = 1000;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      const amplitude = Math.sin(Math.PI * progress) * 0.3;

      // Add noise for whoosh effect
      const noise = (Math.random() * 2 - 1) * 0.1;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude + noise;
    }
  }

  /**
   * Generate pop sound
   */
  private generatePop(data: Float32Array, sampleRate: number, _duration: number): void {
    const frameCount = data.length;
    const frequency = 600;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const amplitude = Math.exp(-t * 50); // Fast decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * 0.4;
    }
  }

  /**
   * Generate swipe sound
   */
  private generateSwipe(data: Float32Array, sampleRate: number, duration: number): void {
    const frameCount = data.length;
    const frequency = 300;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const amplitude = Math.sin(Math.PI * progress) * 0.2;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    }
  }

  /**
   * Generate buzz sound
   */
  private generateBuzz(data: Float32Array, sampleRate: number, _duration: number): void {
    const frameCount = data.length;
    const frequency = 100;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const amplitude = Math.sin(Math.PI * t * 10) * 0.3; // Vibrating amplitude
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    }
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

  /**
   * Clear sound cache
   */
  clearCache(): void {
    this.soundCache.clear();
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
export async function playSound(
  soundType: SoundType,
  options: { haptic?: boolean } = {}
): Promise<void> {
  return getSoundFeedbackService().play(soundType, options);
}
