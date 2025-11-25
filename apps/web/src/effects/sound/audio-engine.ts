/**
 * Professional Audio Engine
 *
 * Advanced audio system with Web Audio API:
 * - Multiple sound effects (send, receive, reaction, match, error)
 * - Spatial audio for 3D positioning
 * - Audio context pooling for performance
 * - Volume normalization and ducking
 * - Support for audio presets and user customization
 * - Haptic feedback synchronization
 */

import { createLogger } from '@/lib/logger';
import { haptics } from '@/lib/haptics';
import type { SoundPreset, SoundEffect, SpatialAudioConfig, AudioContextPool } from './audio-types';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('AudioEngine');

class AudioEngineImpl {
  private audioContext: AudioContext | null = null;
  private contextPool: AudioContextPool[] = [];
  private maxPoolSize = 5;
  private masterVolume = 1.0;
  private isMuted = false;
  private isInitialized = false;
  private activeSounds = new Set<AudioBufferSourceNode>();
  private compressorNode: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private pannerNodes = new Map<string, PannerNode>();

  /**
   * Initialize audio context and nodes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create main audio context
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        logger.warn('Web Audio API not supported');
        return;
      }

      this.audioContext = new AudioContextClass();

      // Wait for audio context to be ready (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create compressor for volume normalization
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = -24;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      // Create master gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.masterVolume;

      // Connect nodes
      this.compressorNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Pre-warm context pool
      await this.warmupPool();

      this.isInitialized = true;
      logger.info('Audio engine initialized');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize audio engine', err);
      throw err;
    }
  }

  /**
   * Pre-warm audio context pool for better performance
   */
  private warmupPool(): Promise<void> {
    for (let i = 0; i < this.maxPoolSize; i++) {
      const context = this.createPooledContext();
      this.contextPool.push(context);
    }
    return Promise.resolve();
  }

  /**
   * Create a pooled audio context
   */
  private createPooledContext(): AudioContextPool {
    const AudioContextClass =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass || !this.audioContext) {
      throw new Error('Audio context not available');
    }

    const context = new AudioContextClass();
    const gainNode = context.createGain();
    gainNode.connect(context.destination);

    return {
      context,
      gainNode,
      inUse: false,
      lastUsed: Date.now(),
    };
  }

  /**
   * Get available context from pool
   */
  private getPooledContext(): AudioContextPool | null {
    const available = this.contextPool.find((ctx) => !ctx.inUse);
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available;
    }

    // Create new context if pool not full
    if (this.contextPool.length < this.maxPoolSize) {
      const newContext = this.createPooledContext();
      newContext.inUse = true;
      this.contextPool.push(newContext);
      return newContext;
    }

    // Reuse oldest context
    const oldest = this.contextPool.reduce((oldest, ctx) =>
      ctx.lastUsed < oldest.lastUsed ? ctx : oldest
    );
    oldest.inUse = true;
    oldest.lastUsed = Date.now();
    return oldest;
  }

  /**
   * Release context back to pool
   */
  private releaseContext(pooledContext: AudioContextPool): void {
    pooledContext.inUse = false;
  }

  /**
   * Play a sound effect
   */
  async playSound(
    effect: SoundEffect,
    options: {
      volume?: number;
      spatial?: SpatialAudioConfig;
      haptic?: boolean;
      hapticType?: 'light' | 'medium' | 'heavy';
    } = {}
  ): Promise<void> {
    if (this.isMuted || !this.isInitialized || !this.audioContext) {
      return;
    }

    try {
      const { volume = 1.0, spatial, haptic = false, hapticType = 'light' } = options;

      // Get preset for effect
      const preset = this.getPreset(effect);

      // Trigger haptic feedback if requested
      if (haptic) {
        haptics.impact(hapticType);
      }

      // Play sound
      await this.playPreset(preset, {
        volume,
        spatial,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to play sound', err, { effect });
    }
  }

  /**
   * Play a sound preset
   */
  private playPreset(
    preset: SoundPreset,
    options: {
      volume?: number;
      spatial?: SpatialAudioConfig;
    } = {}
  ): Promise<void> {
    if (!this.audioContext || !this.compressorNode) {
      return Promise.resolve();
    }

    return Promise.resolve()
      .then(() => {
        const { volume = 1.0, spatial } = options;
        const pooledContext = this.getPooledContext();
        const context = pooledContext?.context ?? this.audioContext;

        if (!context || !this.compressorNode) {
          return;
        }

        // Create oscillator or use buffer
        let source: AudioBufferSourceNode | OscillatorNode;

        if (preset.type === 'oscillator') {
          const oscillator = context.createOscillator();
          oscillator.type = preset.waveform ?? 'sine';
          oscillator.frequency.setValueAtTime(preset.frequency ?? 440, context.currentTime);

          // Apply frequency envelope
          if (preset.frequencyEnvelope) {
            const env = preset.frequencyEnvelope;
            oscillator.frequency.exponentialRampToValueAtTime(
              env.target ?? preset.frequency,
              context.currentTime + (env.duration ?? 0.1)
            );
          }

          source = oscillator;
        } else {
          // Use audio buffer
          if (!preset.buffer) {
            throw new Error('Buffer preset requires audio buffer');
          }
          const bufferSource = context.createBufferSource();
          bufferSource.buffer = preset.buffer;
          source = bufferSource;
        }

        // Create gain node for volume control
        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0, context.currentTime);

        // Apply volume envelope
        if (preset.volumeEnvelope) {
          const env = preset.volumeEnvelope;
          const now = context.currentTime;

          // Attack
          gainNode.gain.linearRampToValueAtTime(
            (env.attack?.peak ?? volume) * this.masterVolume,
            now + (env.attack?.duration ?? 0.01)
          );

          // Sustain
          if (isTruthy(env.sustain?.duration)) {
            gainNode.gain.linearRampToValueAtTime(
              (env.sustain?.level ?? volume * 0.8) * this.masterVolume,
              now + env.sustain.duration
            );
          }

          // Release
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (preset.duration ?? 0.2));
        } else {
          // Simple fade in/out
          gainNode.gain.linearRampToValueAtTime(
            volume * this.masterVolume,
            context.currentTime + 0.01
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime + (preset.duration ?? 0.2)
          );
        }

        // Apply spatial audio if configured
        if (spatial) {
          const panner = context.createPanner();
          panner.panningModel = spatial.model ?? 'HRTF';
          panner.distanceModel = spatial.distanceModel ?? 'inverse';
          panner.refDistance = spatial.refDistance ?? 1;
          panner.maxDistance = spatial.maxDistance ?? 10000;
          panner.rolloffFactor = spatial.rolloffFactor ?? 1;

          if (spatial.position) {
            panner.positionX.value = spatial.position.x;
            panner.positionY.value = spatial.position.y;
            panner.positionZ.value = spatial.position.z;
          }

          source.connect(gainNode);
          gainNode.connect(panner);
          panner.connect(pooledContext?.gainNode ?? this.compressorNode);
        } else {
          source.connect(gainNode);
          gainNode.connect(pooledContext?.gainNode ?? this.compressorNode);
        }

        // Track active sounds
        if (source instanceof AudioBufferSourceNode) {
          this.activeSounds.add(source);
          source.onended = () => {
            this.activeSounds.delete(source);
            if (pooledContext) {
              this.releaseContext(pooledContext);
            }
          };
        } else {
          source.onended = () => {
            if (pooledContext) {
              this.releaseContext(pooledContext);
            }
          };
        }

        // Start playback
        if (source instanceof OscillatorNode) {
          source.start(context.currentTime);
          source.stop(context.currentTime + (preset.duration ?? 0.2));
        } else {
          source.start(0);
        }
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to play preset', err);
        const pooledContext = this.getPooledContext();
        if (pooledContext) {
          this.releaseContext(pooledContext);
        }
      });
  }

  /**
   * Get preset for sound effect
   */
  private getPreset(effect: SoundEffect): SoundPreset {
    // Return predefined presets based on effect type
    // These can be customized by users
    switch (effect) {
      case 'send':
        return {
          type: 'oscillator',
          waveform: 'triangle',
          frequency: 660,
          duration: 0.16,
          volumeEnvelope: {
            attack: { peak: 0.05, duration: 0.02 },
            sustain: { level: 0.03, duration: 0.06 },
            release: { duration: 0.08 },
          },
          frequencyEnvelope: {
            target: 990,
            duration: 0.08,
          },
        };
      case 'receive':
        return {
          type: 'oscillator',
          waveform: 'sine',
          frequency: 440,
          duration: 0.18,
          volumeEnvelope: {
            attack: { peak: 0.04, duration: 0.03 },
            sustain: { level: 0.025, duration: 0.12 },
            release: { duration: 0.03 },
          },
        };
      case 'reaction':
        return {
          type: 'oscillator',
          waveform: 'square',
          frequency: 800,
          duration: 0.12,
          volumeEnvelope: {
            attack: { peak: 0.06, duration: 0.01 },
            release: { duration: 0.11 },
          },
        };
      case 'match':
        return {
          type: 'oscillator',
          waveform: 'sine',
          frequency: 523,
          duration: 0.3,
          volumeEnvelope: {
            attack: { peak: 0.08, duration: 0.05 },
            sustain: { level: 0.04, duration: 0.2 },
            release: { duration: 0.05 },
          },
          frequencyEnvelope: {
            target: 659,
            duration: 0.15,
          },
        };
      case 'error':
        return {
          type: 'oscillator',
          waveform: 'sawtooth',
          frequency: 200,
          duration: 0.2,
          volumeEnvelope: {
            attack: { peak: 0.06, duration: 0.02 },
            release: { duration: 0.18 },
          },
        };
      default:
        return {
          type: 'oscillator',
          waveform: 'sine',
          frequency: 440,
          duration: 0.1,
          volumeEnvelope: {
            attack: { peak: 0.05, duration: 0.01 },
            release: { duration: 0.09 },
          },
        };
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.masterVolume;
    }
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.masterVolume;
    }
  }

  /**
   * Check if muted
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Stop all active sounds
   */
  stopAll(): void {
    this.activeSounds.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore errors when stopping already stopped sources
      }
    });
    this.activeSounds.clear();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopAll();

    // Close all pooled contexts
    for (const pooled of this.contextPool) {
      try {
        await pooled.context.close();
      } catch {
        // Ignore errors
      }
    }
    this.contextPool = [];

    // Close main context
    if (isTruthy(this.audioContext)) {
      try {
        await this.audioContext.close();
      } catch {
        // Ignore errors
      }
      this.audioContext = null;
    }

    this.isInitialized = false;
  }
}

// Export singleton instance
export const audioEngine = new AudioEngineImpl();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  void audioEngine.initialize().catch((error: unknown) => {
    logger.warn('Failed to auto-initialize audio engine', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}
