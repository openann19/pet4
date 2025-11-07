/**
 * SendPing Audio Effect
 * 
 * Enhanced audio feedback for message send using professional audio engine
 * Volume-aware, feature-flagged, with haptic feedback support
 */

import { audioEngine } from './audio-engine'
import { isTruthy, isDefined } from '@/core/guards';

let featureFlags: { enableSendPing: boolean } | null = null

function getFeatureFlags(): { enableSendPing: boolean } {
  if (isTruthy(featureFlags)) {
    return featureFlags
  }
  
  // Lazy load to avoid circular dependencies
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const flags = require('@/config/feature-flags')
    featureFlags = flags.getFeatureFlags()
    return featureFlags
  } catch {
    return { enableSendPing: true }
  }
}

/**
 * Play send ping sound effect
 * Uses advanced audio engine with spatial audio support
 */
export async function sendPing(options: {
  haptic?: boolean
  volume?: number
} = {}): Promise<void> {
  const flags = getFeatureFlags()
  
  if (!flags.enableSendPing) {
    return
  }
  
  try {
    await audioEngine.playSound('send', {
      volume: options.volume,
      haptic: options.haptic !== false, // Default to true
      hapticType: 'light'
    })
  } catch (error) {
    // Silently fail if audio context is not available
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.name !== 'NotAllowedError') {
      // Only log non-permission errors
      // Audio engine handles logging internally
    }
  }
}