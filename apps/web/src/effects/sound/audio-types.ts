/**
 * Audio Engine Types
 */

export type SoundEffect = 'send' | 'receive' | 'reaction' | 'match' | 'error'

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export interface VolumeEnvelope {
  attack?: {
    peak: number
    duration: number
  }
  sustain?: {
    level: number
    duration: number
  }
  release: {
    duration: number
  }
}

export interface FrequencyEnvelope {
  target: number
  duration: number
}

export interface SoundPreset {
  type: 'oscillator' | 'buffer'
  waveform?: WaveformType
  frequency?: number
  duration?: number
  volumeEnvelope?: VolumeEnvelope
  frequencyEnvelope?: FrequencyEnvelope
  buffer?: AudioBuffer
}

export interface SpatialAudioConfig {
  position?: {
    x: number
    y: number
    z: number
  }
  model?: 'equalpower' | 'HRTF'
  distanceModel?: 'linear' | 'inverse' | 'exponential'
  refDistance?: number
  maxDistance?: number
  rolloffFactor?: number
}

export interface AudioContextPool {
  context: AudioContext
  gainNode: GainNode
  inUse: boolean
  lastUsed: number
}
