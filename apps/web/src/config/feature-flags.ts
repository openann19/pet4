import { _isTruthy, isDefined } from '@petspark/shared';

/**
 * Feature Flags Configuration
 *
 * Controls premium features and effects rollout
 */

export interface FeatureFlags {
  enableHoloBackground: boolean;
  enableGlowTrail: boolean;
  enableSendPing: boolean;
  enableMessagePeek: boolean;
  enableSmartImage: boolean;
}

const defaultFlags: FeatureFlags = {
  enableHoloBackground: true,
  enableGlowTrail: true,
  enableSendPing: true,
  enableMessagePeek: true,
  enableSmartImage: true,
};

/**
 * Get feature flags from environment or defaults
 */
export function getFeatureFlags(): FeatureFlags {
  // In production, could fetch from remote config
  if (typeof window !== 'undefined' && '__FEATURE_FLAGS__' in window) {
    const windowWithFlags = window as Window & { __FEATURE_FLAGS__?: Partial<FeatureFlags> };
    if (windowWithFlags.__FEATURE_FLAGS__) {
      return { ...defaultFlags, ...windowWithFlags.__FEATURE_FLAGS__ };
    }
  }

  // Check environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      enableHoloBackground: import.meta.env.VITE_ENABLE_HOLO_BG !== 'false',
      enableGlowTrail: import.meta.env.VITE_ENABLE_GLOW_TRAIL !== 'false',
      enableSendPing: import.meta.env.VITE_ENABLE_SEND_PING !== 'false',
      enableMessagePeek: import.meta.env.VITE_ENABLE_MESSAGE_PEEK !== 'false',
      enableSmartImage: import.meta.env.VITE_ENABLE_SMART_IMAGE !== 'false',
    };
  }

  return defaultFlags;
}

/**
 * Hook to use feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  return getFeatureFlags();
}
