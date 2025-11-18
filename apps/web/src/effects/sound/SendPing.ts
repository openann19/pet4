/**
 * SendPing Audio Effect
 *
 * Enhanced audio feedback for message send using professional audio engine
 * Volume-aware, feature-flagged, with haptic feedback support
 */

import { audioEngine } from './audio-engine';

interface FeatureFlags {
  enableSendPing: boolean;
}

let featureFlags: FeatureFlags | null = null;
let featureFlagsLoadPromise: Promise<FeatureFlags> | null = null;

async function loadFeatureFlags(): Promise<FeatureFlags> {
  if (featureFlags) {
    return featureFlags;
  }
  if (featureFlagsLoadPromise) {
    return featureFlagsLoadPromise;
  }

  featureFlagsLoadPromise = import('@/config/feature-flags')
    .then((module) => {
      const flags = module.getFeatureFlags?.();
      if (flags && typeof flags === 'object' && 'enableSendPing' in flags) {
        featureFlags = { enableSendPing: flags.enableSendPing === true };
      } else {
        featureFlags = { enableSendPing: true };
      }
      return featureFlags;
    })
    .catch(() => {
      const fallback: FeatureFlags = { enableSendPing: true };
      featureFlags = fallback;
      return fallback;
    });

  return featureFlagsLoadPromise;
}

function getFeatureFlags(): FeatureFlags {
  // Synchronous access - will use cached value or default
  if (featureFlags) {
    return featureFlags;
  }
  // Initialize asynchronously (non-blocking)
  loadFeatureFlags().catch(() => {
    // Silent fail - will use default on next call
  });
  return { enableSendPing: true };
}

/**
 * Play send ping sound effect
 * Uses advanced audio engine with spatial audio support
 */
export async function sendPing(
  options: {
    haptic?: boolean;
    volume?: number;
  } = {}
): Promise<void> {
  const flags = getFeatureFlags();

  if (!flags.enableSendPing) {
    return;
  }

  try {
    await audioEngine.playSound('send', {
      volume: options.volume,
      haptic: options.haptic !== false, // Default to true
      hapticType: 'light',
    });
  } catch (_error) {
    // Silently fail if audio context is not available
    const err = _error instanceof Error ? _error : new Error(String(_error));
    if (err.name !== 'NotAllowedError') {
      // Only log non-permission errors
      // Audio engine handles logging internally
    }
  }
}
