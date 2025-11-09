import { createLogger } from './logger';
import { getStorageItem } from './cache/local-storage';
import type { ConsentPreferences } from '@petspark/shared';
import { DEFAULT_CONSENT_PREFERENCES } from '@petspark/shared';

type EventProperties = Record<string, string | number | boolean>;

const logger = createLogger('Analytics');

const CONSENT_STORAGE_KEY = 'gdpr-consent';

/**
 * Get consent preferences from storage
 */
function getConsentPreferences(): ConsentPreferences {
  const stored = getStorageItem<ConsentPreferences>(CONSENT_STORAGE_KEY);
  return stored ?? DEFAULT_CONSENT_PREFERENCES;
}

/**
 * Check if analytics consent is granted
 */
function hasAnalyticsConsent(): boolean {
  const preferences = getConsentPreferences();
  return preferences.analytics === true;
}

class Analytics {
  track(eventName: string, properties?: EventProperties): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Check consent before tracking
    if (!hasAnalyticsConsent()) {
      logger.debug('Analytics tracking skipped - consent not granted', { eventName });
      return;
    }

    logger.debug('Track event', { eventName, properties });

    if (window.spark_analytics) {
      window.spark_analytics.track(eventName, properties);
    }
  }

  /**
   * Check if analytics is enabled (consent granted)
   */
  isEnabled(): boolean {
    return hasAnalyticsConsent();
  }

  /**
   * Clear analytics data (when consent is withdrawn)
   */
  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    logger.debug('Clearing analytics data');

    // Clear analytics data if provider supports it
    if (window.spark_analytics && typeof window.spark_analytics.clear === 'function') {
      window.spark_analytics.clear();
    }
  }
}

export const analytics = new Analytics();

declare global {
  interface Window {
    spark_analytics?: {
      track: (eventName: string, properties?: EventProperties) => void;
    };
  }
}
