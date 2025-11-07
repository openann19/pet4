import { Platform } from 'react-native';
import { isReduceMotionEnabled } from '../reduced-motion';

// If using Expo: import * as Haptics from 'expo-haptics';
let Haptics: {
  impactAsync?: (style: number) => Promise<void>;
  ImpactFeedbackStyle?: {
    Light: number;
    Medium: number;
    Heavy: number;
  };
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics not available
}

/**
 * Haptic feedback utilities.
 * Respects reduced motion preferences (no haptics when enabled).
 * Enforces 250ms cooldown to prevent haptic spam.
 */
let lastHapticTime = 0;
const HAPTIC_COOLDOWN = 250;

function shouldTriggerHaptic(): boolean {
  if (isReduceMotionEnabled()) {
    return false; // No haptics when reduced motion is enabled
  }
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_COOLDOWN) {
    return false; // Cooldown active
  }
  lastHapticTime = now;
  return true;
}

export const haptic = {
  light(): void {
    if (Platform.OS !== 'web' && Haptics?.impactAsync && shouldTriggerHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light ?? 0);
    }
  },
  medium(): void {
    if (Platform.OS !== 'web' && Haptics?.impactAsync && shouldTriggerHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Medium ?? 1);
    }
  },
  heavy(): void {
    if (Platform.OS !== 'web' && Haptics?.impactAsync && shouldTriggerHaptic()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Heavy ?? 2);
    }
  },
};

