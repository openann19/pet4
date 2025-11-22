/**
 * Security & Privacy Module
 *
 * Comprehensive security utilities including encryption, authentication, and privacy
 */

export { useEncryption } from './use-encryption';
export type {
  EncryptionConfig,
  EncryptedData,
  EncryptionState,
} from './use-encryption';

export { useBiometricAuth } from './use-biometric-auth';
export type {
  BiometricAuthConfig,
  BiometricState,
} from './use-biometric-auth';

export { useRateLimiter } from './use-rate-limiter';
export type {
  RateLimitConfig,
  RateLimiterConfig,
  RateLimitState,
} from './use-rate-limiter';

export { usePrivacyConsent } from './use-privacy-consent';
export type {
  ConsentCategory,
  ConsentState,
  ConsentRecord,
  PrivacyConsentConfig,
  PrivacyState,
  DataExportData,
} from './use-privacy-consent';
