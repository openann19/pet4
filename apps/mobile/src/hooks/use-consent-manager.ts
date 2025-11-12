/**
 * Mobile Consent Manager Hook
 *
 * Manages user consent preferences for GDPR compliance on mobile.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gdprService } from '../lib/gdpr-service';
import { createLogger } from '../lib/logger';
import type {
  ConsentCategory,
  ConsentPreferences,
  ConsentRecord,
  ConsentUpdateRequest,
} from '@petspark/shared';
import { ConsentManager as ConsentManagerUtil, CONSENT_VERSION, DEFAULT_CONSENT_PREFERENCES } from '@petspark/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = createLogger('ConsentManager');

const CONSENT_STORAGE_KEY = 'gdpr-consent';

interface ConsentState {
  preferences: ConsentPreferences;
  consents: ConsentRecord[];
  isLoaded: boolean;
}

export interface UseConsentManagerOptions {
  userId?: string | null;
  autoLoad?: boolean;
}

export interface UseConsentManagerReturn {
  preferences: ConsentPreferences;
  consents: ConsentRecord[];
  isLoaded: boolean;
  isLoading: boolean;
  hasConsent: (category: ConsentCategory) => boolean;
  acceptConsent: (category: ConsentCategory) => Promise<void>;
  rejectConsent: (category: ConsentCategory) => Promise<void>;
  withdrawConsent: (category: ConsentCategory) => Promise<void>;
  updatePreferences: (preferences: Partial<ConsentPreferences>) => Promise<void>;
  clearConsent: () => void;
  refreshConsents: () => Promise<void>;
}

async function getStoredConsentPreferences(): Promise<ConsentPreferences | null> {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ConsentPreferences) : null;
  } catch {
    return null;
  }
}

async function storeConsentPreferences(preferences: ConsentPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to store consent preferences', { error: err.message });
  }
}

async function clearStoredConsentPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to clear consent preferences', { error: err.message });
  }
}

export function useConsentManager(options: UseConsentManagerOptions = {}): UseConsentManagerReturn {
  const { userId: providedUserId, autoLoad = true } = options;
  const queryClient = useQueryClient();

  const [state, setState] = useState<ConsentState>({
    preferences: DEFAULT_CONSENT_PREFERENCES,
    consents: [],
    isLoaded: false,
  });

  const userId = providedUserId ?? null;

  const {
    data: consents = [],
    isLoading,
    refetch: refetchConsents,
  } = useQuery({
    queryKey: ['gdpr-consent', userId],
    queryFn: () => {
      if (!userId) {
        return Promise.resolve([]);
      }
      return gdprService.getConsentStatus(userId);
    },
    enabled: autoLoad && Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const updateConsentMutation = useMutation({
    mutationFn: (request: ConsentUpdateRequest) => gdprService.updateConsent(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gdpr-consent', userId] });
      void refetchConsents();
    },
  });

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    const loadPreferences = async (): Promise<void> => {
      const storedPreferences = await getStoredConsentPreferences();
      const apiPreferences = ConsentManagerUtil.getConsentPreferences(consents);

      const mergedPreferences: ConsentPreferences = {
        ...DEFAULT_CONSENT_PREFERENCES,
        ...storedPreferences,
        ...apiPreferences,
      };

      setState({
        preferences: mergedPreferences,
        consents,
        isLoaded: true,
      });
    };

    void loadPreferences();
  }, [consents, autoLoad]);

  const hasConsent = useCallback(
    (category: ConsentCategory): boolean => {
      if (category === 'third_party') {
        return ConsentManagerUtil.hasConsent(consents, category) || state.preferences.thirdParty === true;
      }
      const prefKey = category === 'essential' ? 'essential' : category === 'analytics' ? 'analytics' : 'marketing';
      return ConsentManagerUtil.hasConsent(consents, category) || state.preferences[prefKey] === true;
    },
    [consents, state.preferences]
  );

  const acceptConsent = useCallback(
    async (category: ConsentCategory): Promise<void> => {
      if (!ConsentManagerUtil.validateConsentUpdate(category, 'accepted')) {
        throw new Error(`Cannot accept consent for ${category}`);
      }

      const newPreferences: ConsentPreferences = {
        ...state.preferences,
        ...(category === 'third_party' ? { thirdParty: true } : { [category]: true }),
      };
      setState((prev) => ({
        ...prev,
        preferences: newPreferences,
      }));
      await storeConsentPreferences(newPreferences);

      if (userId) {
        try {
          await updateConsentMutation.mutateAsync({
            userId,
            category,
            status: 'accepted',
            version: CONSENT_VERSION,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to update consent in API', { error: err.message, userId, category });
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  const rejectConsent = useCallback(
    async (category: ConsentCategory): Promise<void> => {
      if (!ConsentManagerUtil.validateConsentUpdate(category, 'rejected')) {
        throw new Error(`Cannot reject consent for ${category}`);
      }

      const newPreferences: ConsentPreferences = {
        ...state.preferences,
        ...(category === 'third_party' ? { thirdParty: false } : { [category]: false }),
      };
      setState((prev) => ({
        ...prev,
        preferences: newPreferences,
      }));
      await storeConsentPreferences(newPreferences);

      if (userId) {
        try {
          await updateConsentMutation.mutateAsync({
            userId,
            category,
            status: 'rejected',
            version: CONSENT_VERSION,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to update consent in API', { error: err.message, userId, category });
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  const withdrawConsent = useCallback(
    async (category: ConsentCategory): Promise<void> => {
      if (!ConsentManagerUtil.canWithdrawConsent(category)) {
        throw new Error(`Cannot withdraw consent for ${category}`);
      }

      const newPreferences: ConsentPreferences = {
        ...state.preferences,
        ...(category === 'third_party' ? { thirdParty: false } : { [category]: false }),
      };
      setState((prev) => ({
        ...prev,
        preferences: newPreferences,
      }));
      await storeConsentPreferences(newPreferences);

      if (userId) {
        try {
          await updateConsentMutation.mutateAsync({
            userId,
            category,
            status: 'withdrawn',
            version: CONSENT_VERSION,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to withdraw consent in API', { error: err.message, userId, category });
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  const updatePreferences = useCallback(
    async (newPreferences: Partial<ConsentPreferences>): Promise<void> => {
      const updatedPreferences: ConsentPreferences = {
        ...state.preferences,
        ...newPreferences,
      };

      setState((prev) => ({
        ...prev,
        preferences: updatedPreferences,
      }));
      await storeConsentPreferences(updatedPreferences);

      if (userId) {
        if (newPreferences.analytics !== undefined) {
          try {
            await updateConsentMutation.mutateAsync({
              userId,
              category: 'analytics',
              status: newPreferences.analytics ? 'accepted' : 'rejected',
              version: CONSENT_VERSION,
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to update consent in API', { error: err.message, userId, category: 'analytics' });
          }
        }
        if (newPreferences.marketing !== undefined) {
          try {
            await updateConsentMutation.mutateAsync({
              userId,
              category: 'marketing',
              status: newPreferences.marketing ? 'accepted' : 'rejected',
              version: CONSENT_VERSION,
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to update consent in API', { error: err.message, userId, category: 'marketing' });
          }
        }
        if (newPreferences.thirdParty !== undefined) {
          try {
            await updateConsentMutation.mutateAsync({
              userId,
              category: 'third_party',
              status: newPreferences.thirdParty ? 'accepted' : 'rejected',
              version: CONSENT_VERSION,
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to update consent in API', { error: err.message, userId, category: 'third_party' });
          }
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  const clearConsent = useCallback((): void => {
    void clearStoredConsentPreferences();
    setState({
      preferences: DEFAULT_CONSENT_PREFERENCES,
      consents: [],
      isLoaded: false,
    });
  }, []);

  const refreshConsents = useCallback(async (): Promise<void> => {
    await refetchConsents();
  }, [refetchConsents]);

  return {
    preferences: state.preferences,
    consents: state.consents,
    isLoaded: state.isLoaded,
    isLoading,
    hasConsent,
    acceptConsent,
    rejectConsent,
    withdrawConsent,
    updatePreferences,
    clearConsent,
    refreshConsents,
  };
}
