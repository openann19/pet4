/**
 * Consent Manager Hook
 *
 * Manages user consent preferences and status for GDPR compliance.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gdprApi } from '@/api/gdpr-api';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/lib/cache/local-storage';
import { createLogger } from '@/lib/logger';
import type {
  ConsentCategory,
  ConsentStatus,
  ConsentPreferences,
  ConsentRecord,
  ConsentUpdateRequest,
  ConsentManager,
} from '@petspark/shared';
import { ConsentManager as ConsentManagerUtil, CONSENT_VERSION, DEFAULT_CONSENT_PREFERENCES } from '@petspark/shared';

const logger = createLogger('ConsentManager');

const CONSENT_STORAGE_KEY = 'gdpr-consent';
const CONSENT_USER_ID_KEY = 'gdpr-consent-user-id';

interface ConsentState {
  preferences: ConsentPreferences;
  consents: ConsentRecord[];
  isLoaded: boolean;
}

/**
 * Get user ID from storage or context
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get from storage
  const storedUserId = getStorageItem<string>(CONSENT_USER_ID_KEY);
  if (storedUserId) {
    return storedUserId;
  }

  // Try to get from auth context or localStorage
  try {
    const authData = localStorage.getItem('user');
    if (authData) {
      const user = JSON.parse(authData) as { id?: string };
      if (user.id) {
        setStorageItem(CONSENT_USER_ID_KEY, user.id);
        return user.id;
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Get consent preferences from localStorage
 */
function getStoredConsentPreferences(): ConsentPreferences | null {
  return getStorageItem<ConsentPreferences>(CONSENT_STORAGE_KEY);
}

/**
 * Store consent preferences in localStorage
 */
function storeConsentPreferences(preferences: ConsentPreferences): void {
  setStorageItem(CONSENT_STORAGE_KEY, preferences);
}

/**
 * Clear consent preferences from localStorage
 */
function clearStoredConsentPreferences(): void {
  removeStorageItem(CONSENT_STORAGE_KEY);
}

/**
 * Check if Do Not Track is enabled
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return (
    navigator.doNotTrack === '1' ||
    (navigator as { msDoNotTrack?: string }).msDoNotTrack === '1' ||
    (window as { doNotTrack?: string }).doNotTrack === '1'
  );
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

/**
 * Hook to manage user consent preferences
 */
export function useConsentManager(
  options: UseConsentManagerOptions = {}
): UseConsentManagerReturn {
  const { userId: providedUserId, autoLoad = true } = options;
  const queryClient = useQueryClient();

  const [state, setState] = useState<ConsentState>({
    preferences: DEFAULT_CONSENT_PREFERENCES,
    consents: [],
    isLoaded: false,
  });

  const userId = providedUserId ?? getUserId();

  // Load consent status from API
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
      return gdprApi.getConsentStatus(userId);
    },
    enabled: autoLoad && Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update consent mutation
  const updateConsentMutation = useMutation({
    mutationFn: (request: ConsentUpdateRequest) => gdprApi.updateConsent(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gdpr-consent', userId] });
      void refetchConsents();
    },
  });

  // Load preferences from localStorage and API
  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    const storedPreferences = getStoredConsentPreferences();
    const apiPreferences = ConsentManagerUtil.getConsentPreferences(consents);

    // Merge stored and API preferences (API takes precedence)
    const mergedPreferences: ConsentPreferences = {
      ...DEFAULT_CONSENT_PREFERENCES,
      ...storedPreferences,
      ...apiPreferences,
    };

    // Respect Do Not Track
    if (isDoNotTrackEnabled()) {
      mergedPreferences.analytics = false;
      mergedPreferences.marketing = false;
      mergedPreferences.thirdParty = false;
    }

    setState({
      preferences: mergedPreferences,
      consents,
      isLoaded: true,
    });
  }, [consents, autoLoad]);

  // Check if user has consent for a category
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

  // Accept consent
  const acceptConsent = useCallback(
    async (category: ConsentCategory): Promise<void> => {
      if (!ConsentManagerUtil.validateConsentUpdate(category, 'accepted')) {
        throw new Error(`Cannot accept consent for ${category}`);
      }

      // Update local state
      const newPreferences: ConsentPreferences = {
        ...state.preferences,
        ...(category === 'third_party' ? { thirdParty: true } : { [category]: true }),
      };
      setState((prev) => ({
        ...prev,
        preferences: newPreferences,
      }));
      storeConsentPreferences(newPreferences);

      // Update API if user is authenticated
      if (userId) {
        try {
          await updateConsentMutation.mutateAsync({
            userId,
            category,
            status: 'accepted',
            version: CONSENT_VERSION,
            ipAddress: undefined, // Will be set by server
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          });
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('Failed to update consent in API', err, { userId, category });
          // Don't throw - local state is updated
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  // Reject consent
  const rejectConsent = useCallback(
    async (category: ConsentCategory): Promise<void> => {
      if (!ConsentManagerUtil.validateConsentUpdate(category, 'rejected')) {
        throw new Error(`Cannot reject consent for ${category}`);
      }

      // Update local state
      const newPreferences: ConsentPreferences = {
        ...state.preferences,
        ...(category === 'third_party' ? { thirdParty: false } : { [category]: false }),
      };
      setState((prev) => ({
        ...prev,
        preferences: newPreferences,
      }));
      storeConsentPreferences(newPreferences);

      // Update API if user is authenticated
      if (userId) {
        try {
          await updateConsentMutation.mutateAsync({
            userId,
            category,
            status: 'rejected',
            version: CONSENT_VERSION,
            ipAddress: undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          });
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('Failed to update consent in API', err, { userId, category });
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  // Withdraw consent
  const withdrawConsent = useCallback(
    async (category: ConsentCategory): Promise<void> => {
      if (!ConsentManagerUtil.canWithdrawConsent(category)) {
        throw new Error(`Cannot withdraw consent for ${category}`);
      }

      // Update local state
      const newPreferences: ConsentPreferences = {
        ...state.preferences,
        ...(category === 'third_party' ? { thirdParty: false } : { [category]: false }),
      };
      setState((prev) => ({
        ...prev,
        preferences: newPreferences,
      }));
      storeConsentPreferences(newPreferences);

      // Update API if user is authenticated
      if (userId) {
        try {
          await updateConsentMutation.mutateAsync({
            userId,
            category,
            status: 'withdrawn',
            version: CONSENT_VERSION,
            ipAddress: undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          });
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('Failed to withdraw consent in API', err, { userId, category });
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  // Update preferences
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
      storeConsentPreferences(updatedPreferences);

      // Update API for each changed category
      if (userId) {
        if (newPreferences.analytics !== undefined) {
          try {
            await updateConsentMutation.mutateAsync({
              userId,
              category: 'analytics',
              status: newPreferences.analytics ? 'accepted' : 'rejected',
              version: CONSENT_VERSION,
              ipAddress: undefined,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            });
          } catch (_error) {
            const err = _error instanceof Error ? _error : new Error(String(_error));
            logger.error('Failed to update consent in API', err, { userId, category: 'analytics' });
          }
        }
        if (newPreferences.marketing !== undefined) {
          try {
            await updateConsentMutation.mutateAsync({
              userId,
              category: 'marketing',
              status: newPreferences.marketing ? 'accepted' : 'rejected',
              version: CONSENT_VERSION,
              ipAddress: undefined,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            });
          } catch (_error) {
            const err = _error instanceof Error ? _error : new Error(String(_error));
            logger.error('Failed to update consent in API', err, { userId, category: 'marketing' });
          }
        }
        if (newPreferences.thirdParty !== undefined) {
          try {
            await updateConsentMutation.mutateAsync({
              userId,
              category: 'third_party',
              status: newPreferences.thirdParty ? 'accepted' : 'rejected',
              version: CONSENT_VERSION,
              ipAddress: undefined,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            });
          } catch (_error) {
            const err = _error instanceof Error ? _error : new Error(String(_error));
            logger.error('Failed to update consent in API', err, { userId, category: 'third_party' });
          }
        }
      }
    },
    [state.preferences, userId, updateConsentMutation]
  );

  // Clear consent
  const clearConsent = useCallback((): void => {
    clearStoredConsentPreferences();
    setState({
      preferences: DEFAULT_CONSENT_PREFERENCES,
      consents: [],
      isLoaded: false,
    });

    // Clear analytics data when consent is withdrawn
    if (typeof window !== 'undefined' && window.spark_analytics) {
      try {
        // Dynamically import analytics to avoid circular dependency
        void import('@/lib/analytics')
          .then((module) => {
            module.analytics.clear();
          })
          .catch((_error: unknown) => {
            // Silently fail analytics clear - non-critical operation
            // Error is intentionally swallowed
          });
      } catch {
        // Ignore errors
      }
    }
  }, []);

  // Refresh consents
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
