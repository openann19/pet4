import { createLogger } from './logger';
import { getStorageItem } from './cache/local-storage';
import type { ConsentPreferences } from '@petspark/shared';
import { DEFAULT_CONSENT_PREFERENCES } from '@petspark/shared';

type EventProperties = Record<string, string | number | boolean>;

const logger = createLogger('Analytics');

/**
 * Hash email address using SHA-256 for privacy-compliant analytics tracking.
 * Returns a hex-encoded hash string.
 *
 * @param email - Email address to hash
 * @returns Promise resolving to hex-encoded SHA-256 hash
 */
export async function hashEmail(email: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for environments without crypto API
    logger.warn('Crypto API not available, using fallback hashing');
    return `hashed_${email.length}_${email.charCodeAt(0)}`;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to hash email', errorObj);
    // Return a safe fallback that doesn't leak PII
    return `error_${email.length}`;
  }
}

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
    if (
      window.spark_analytics &&
      'clear' in window.spark_analytics &&
      typeof window.spark_analytics.clear === 'function'
    ) {
      try {
        // TypeScript-safe call after runtime check
        (window.spark_analytics.clear as () => void)();
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to clear analytics data', errorObj);
      }
    }
  }
}

export const analytics = new Analytics();

declare global {
  interface Window {
    spark_analytics?: {
      track: (eventName: string, properties?: EventProperties) => void;
      clear?: () => void;
    };
  }
}
