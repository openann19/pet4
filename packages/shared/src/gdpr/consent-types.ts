/**
 * Consent Types
 *
 * Defines consent categories, status, and record structure for GDPR compliance.
 */

export type ConsentCategory = 'essential' | 'analytics' | 'marketing' | 'third_party';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface ConsentRecord {
  id: string;
  userId: string;
  category: ConsentCategory;
  status: ConsentStatus;
  version: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentPreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

export interface ConsentHistoryItem {
  category: ConsentCategory;
  status: ConsentStatus;
  timestamp: string;
  version: string;
}

export const CONSENT_VERSION = '1.0.0' as const;

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  thirdParty: false,
} as const;
