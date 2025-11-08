/**
 * Feature Flags Configuration (Mobile)
 *
 * Controls premium features and effects rollout
 * Aligned with web feature flags for parity
 *
 * Location: apps/mobile/src/config/feature-flags.ts
 */

export type FeatureFlagKey =
  | 'stories_enabled'
  | 'voice_messages_enabled'
  | 'location_sharing_enabled'
  | 'ai_photo_analysis_enabled'
  | 'premium_animations_enabled'
  | 'push_notifications_enabled'
  | 'advanced_filters_enabled'
  | 'story_highlights_enabled'
  | 'message_reactions_enabled'
  | 'typing_indicators_enabled'
  | 'read_receipts_enabled'
  | 'chat.confetti'
  | 'chat.reactionBurst'
  | 'chat.auroraRing'
  | 'chat.virtualization'
  | 'enableHoloBackground'
  | 'enableMessagePeek'
  | 'enableSmartImage'

export interface FeatureFlags {
  stories_enabled: boolean
  voice_messages_enabled: boolean
  location_sharing_enabled: boolean
  ai_photo_analysis_enabled: boolean
  premium_animations_enabled: boolean
  push_notifications_enabled: boolean
  advanced_filters_enabled: boolean
  story_highlights_enabled: boolean
  message_reactions_enabled: boolean
  typing_indicators_enabled: boolean
  read_receipts_enabled: boolean
  'chat.confetti': boolean
  'chat.reactionBurst': boolean
  'chat.auroraRing': boolean
  'chat.virtualization': boolean
  enableHoloBackground: boolean
  enableMessagePeek: boolean
  enableSmartImage: boolean
}

const defaultFlags: FeatureFlags = {
  stories_enabled: true,
  voice_messages_enabled: true,
  location_sharing_enabled: true,
  ai_photo_analysis_enabled: true,
  premium_animations_enabled: true,
  push_notifications_enabled: true,
  advanced_filters_enabled: true,
  story_highlights_enabled: true,
  message_reactions_enabled: true,
  typing_indicators_enabled: true,
  read_receipts_enabled: true,
  'chat.confetti': false,
  'chat.reactionBurst': false,
  'chat.auroraRing': false,
  'chat.virtualization': false,
  enableHoloBackground: true,
  enableMessagePeek: true,
  enableSmartImage: true,
}

/**
 * Get feature flags from environment or defaults
 * Aligned with web feature flags for parity
 */
export function getFeatureFlags(): FeatureFlags {
  // Check environment variables
  if (typeof process !== 'undefined' && process.env) {
    return {
      stories_enabled: process.env['EXPO_PUBLIC_STORIES_ENABLED'] !== 'false',
      voice_messages_enabled: process.env['EXPO_PUBLIC_VOICE_MESSAGES_ENABLED'] !== 'false',
      location_sharing_enabled: process.env['EXPO_PUBLIC_LOCATION_SHARING_ENABLED'] !== 'false',
      ai_photo_analysis_enabled: process.env['EXPO_PUBLIC_AI_PHOTO_ANALYSIS_ENABLED'] !== 'false',
      premium_animations_enabled: process.env['EXPO_PUBLIC_PREMIUM_ANIMATIONS_ENABLED'] !== 'false',
      push_notifications_enabled: process.env['EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED'] !== 'false',
      advanced_filters_enabled: process.env['EXPO_PUBLIC_ADVANCED_FILTERS_ENABLED'] !== 'false',
      story_highlights_enabled: process.env['EXPO_PUBLIC_STORY_HIGHLIGHTS_ENABLED'] !== 'false',
      message_reactions_enabled: process.env['EXPO_PUBLIC_MESSAGE_REACTIONS_ENABLED'] !== 'false',
      typing_indicators_enabled: process.env['EXPO_PUBLIC_TYPING_INDICATORS_ENABLED'] !== 'false',
      read_receipts_enabled: process.env['EXPO_PUBLIC_READ_RECEIPTS_ENABLED'] !== 'false',
      'chat.confetti': process.env['EXPO_PUBLIC_CHAT_CONFETTI'] === 'true',
      'chat.reactionBurst': process.env['EXPO_PUBLIC_CHAT_REACTION_BURST'] === 'true',
      'chat.auroraRing': process.env['EXPO_PUBLIC_CHAT_AURORA_RING'] === 'true',
      'chat.virtualization': process.env['EXPO_PUBLIC_CHAT_VIRTUALIZATION'] === 'true',
      enableHoloBackground: process.env['EXPO_PUBLIC_ENABLE_HOLO_BG'] !== 'false',
      enableMessagePeek: process.env['EXPO_PUBLIC_ENABLE_MESSAGE_PEEK'] !== 'false',
      enableSmartImage: process.env['EXPO_PUBLIC_ENABLE_SMART_IMAGE'] !== 'false',
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

/**
 * Check if a specific feature flag is enabled
 */
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  const flags = getFeatureFlags()
  return flags[flagKey] ?? false
}
