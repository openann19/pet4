import { useStorage } from '@/hooks/use-storage';
import { useEffect, useState } from 'react';
import { storage } from './storage';
import { featureFlagsApi } from '@/api/feature-flags-api';

export type FeatureFlagKey =
  | 'stories_enabled'
  | 'voice_messages_enabled'
  | 'location_sharing_enabled'
  | 'ai_photo_analysis_enabled'
  | 'admin_console_enabled'
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
  | 'chat.virtualization';

export interface FeatureFlag {
  key: FeatureFlagKey;
  enabled: boolean;
  rolloutPercentage: number;
  environments: ('dev' | 'staging' | 'prod')[];
  description: string;
  lastModified: string;
  modifiedBy: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  startDate: string;
  endDate?: string;
  variants: ABTestVariant[];
  targetingRules?: {
    userSegments?: string[];
    locations?: string[];
    platforms?: string[];
  };
}

const DEFAULT_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  stories_enabled: {
    key: 'stories_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: '24-hour expiring stories feature',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  voice_messages_enabled: {
    key: 'voice_messages_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Voice message recording and playback',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  location_sharing_enabled: {
    key: 'location_sharing_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Real-time location sharing in chat',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  ai_photo_analysis_enabled: {
    key: 'ai_photo_analysis_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'AI-powered pet photo analysis',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  admin_console_enabled: {
    key: 'admin_console_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Admin console access',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  premium_animations_enabled: {
    key: 'premium_animations_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Premium animations and micro-interactions',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  push_notifications_enabled: {
    key: 'push_notifications_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Push notification system',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  advanced_filters_enabled: {
    key: 'advanced_filters_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Advanced discovery filters',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  story_highlights_enabled: {
    key: 'story_highlights_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Permanent story highlight collections',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  message_reactions_enabled: {
    key: 'message_reactions_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Emoji reactions on messages',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  typing_indicators_enabled: {
    key: 'typing_indicators_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Real-time typing indicators',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  read_receipts_enabled: {
    key: 'read_receipts_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Message read receipts',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  'chat.confetti': {
    key: 'chat.confetti',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['dev', 'staging', 'prod'],
    description: 'Confetti celebration effect for matches/likes',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  'chat.reactionBurst': {
    key: 'chat.reactionBurst',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['dev', 'staging', 'prod'],
    description: 'Reaction burst animation with particles',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  'chat.auroraRing': {
    key: 'chat.auroraRing',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['dev', 'staging', 'prod'],
    description: 'Aurora ring glow effect for active users',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  'chat.virtualization': {
    key: 'chat.virtualization',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['dev', 'staging', 'prod'],
    description: 'Virtualized message list for 10k+ messages',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
};

export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const [flags] = useStorage<Record<FeatureFlagKey, FeatureFlag>>('feature-flags', DEFAULT_FLAGS);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!flags?.[flagKey]) {
      setIsEnabled(DEFAULT_FLAGS[flagKey].enabled);
      return;
    }

    const flag = flags[flagKey];

    if (!flag.enabled) {
      setIsEnabled(false);
      return;
    }

    if (flag.rolloutPercentage < 100) {
      const userId = localStorage.getItem('user-id') ?? 'anonymous';
      const hash = hashString(userId + flagKey);
      const userPercentile = hash % 100;
      setIsEnabled(userPercentile < flag.rolloutPercentage);
    } else {
      setIsEnabled(true);
    }
  }, [flags, flagKey]);

  return isEnabled;
}

export function useFeatureFlags(): Record<FeatureFlagKey, boolean> {
  const [flags] = useStorage<Record<FeatureFlagKey, FeatureFlag>>('feature-flags', DEFAULT_FLAGS);
  const [enabledFlags, setEnabledFlags] = useState<Record<FeatureFlagKey, boolean>>(
    {} as Record<FeatureFlagKey, boolean>
  );

  useEffect(() => {
    const result = {} as Record<FeatureFlagKey, boolean>;

    Object.keys(DEFAULT_FLAGS).forEach((key) => {
      const flagKey = key as FeatureFlagKey;
      const flag = flags?.[flagKey] ?? DEFAULT_FLAGS[flagKey];

      if (!flag.enabled) {
        result[flagKey] = false;
        return;
      }

      if (flag.rolloutPercentage < 100) {
        const userId = localStorage.getItem('user-id') ?? 'anonymous';
        const hash = hashString(userId + flagKey);
        const userPercentile = hash % 100;
        result[flagKey] = userPercentile < flag.rolloutPercentage;
      } else {
        result[flagKey] = true;
      }
    });

    setEnabledFlags(result);
  }, [flags]);

  return enabledFlags;
}

export async function updateFeatureFlag(
  flagKey: FeatureFlagKey,
  updates: Partial<FeatureFlag>,
  modifiedBy: string
): Promise<void> {
  try {
    await featureFlagsApi.updateFeatureFlag(flagKey, updates, modifiedBy);

    // Update local cache for immediate UI updates
    const currentFlags =
      (await storage.get<Record<FeatureFlagKey, FeatureFlag>>('feature-flags')) ?? DEFAULT_FLAGS;
    currentFlags[flagKey] = {
      ...currentFlags[flagKey],
      ...updates,
      lastModified: new Date().toISOString(),
      modifiedBy,
    };
    await storage.set('feature-flags', currentFlags);
  } catch {
    // Fallback to local storage if API fails
    const currentFlags =
      (await storage.get<Record<FeatureFlagKey, FeatureFlag>>('feature-flags')) ?? DEFAULT_FLAGS;
    currentFlags[flagKey] = {
      ...currentFlags[flagKey],
      ...updates,
      lastModified: new Date().toISOString(),
      modifiedBy,
    };
    await storage.set('feature-flags', currentFlags);
  }
}

export async function getABTestVariant(
  testId: string,
  userId: string
): Promise<ABTestVariant | null> {
  try {
    return await featureFlagsApi.getABTestVariant(testId, userId);
  } catch {
    // Fallback to local storage if API fails
    const tests = (await storage.get<Record<string, ABTest>>('ab-tests')) ?? {};
    const test = tests[testId];

    if (!test?.enabled) {
      return null;
    }

    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = test.endDate ? new Date(test.endDate) : null;

    if (now < startDate || (endDate && now > endDate)) {
      return null;
    }

    const hash = hashString(userId + testId);
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    const userValue = hash % totalWeight;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (userValue < cumulativeWeight) {
        return variant;
      }
    }

    return test.variants[0] ?? null;
  }
}

export async function trackABTestExposure(
  testId: string,
  userId: string,
  variantId: string
): Promise<void> {
  try {
    await featureFlagsApi.trackABTestExposure(testId, userId, variantId);
  } catch {
    // Fallback to local storage if API fails
    const exposures =
      (await storage.get<
        {
          testId: string;
          userId: string;
          variantId: string;
          timestamp: string;
        }[]
      >('ab-test-exposures')) ?? [];

    exposures.push({
      testId,
      userId,
      variantId,
      timestamp: new Date().toISOString(),
    });

    await storage.set('ab-test-exposures', exposures.slice(-10000));
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
