/**
 * Feature Flags Configuration (Mobile)
 * 
 * Controls premium features and effects rollout
 */

export interface FeatureFlags {
  enableHoloBackground: boolean
  enableMessagePeek: boolean
  enableSmartImage: boolean
}

const defaultFlags: FeatureFlags = {
  enableHoloBackground: true,
  enableMessagePeek: true,
  enableSmartImage: true,
}

/**
 * Get feature flags from environment or defaults
 */
export function getFeatureFlags(): FeatureFlags {
  // Check environment variables
  if (typeof process !== 'undefined' && process.env) {
    return {
      enableHoloBackground: process.env.EXPO_PUBLIC_ENABLE_HOLO_BG !== 'false',
      enableMessagePeek: process.env.EXPO_PUBLIC_ENABLE_MESSAGE_PEEK !== 'false',
      enableSmartImage: process.env.EXPO_PUBLIC_ENABLE_SMART_IMAGE !== 'false',
    }
  }
  
  return defaultFlags
}

/**
 * Hook to use feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  return getFeatureFlags()
}

