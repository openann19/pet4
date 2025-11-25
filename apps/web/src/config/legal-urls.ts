/**
 * Legal URLs Configuration
 *
 * Centralized configuration for legal document URLs (terms, privacy policy).
 * Supports environment-specific URLs via environment variables.
 */

export const LEGAL_URLS = {
  terms:
    (import.meta.env.VITE_LEGAL_TERMS_URL as string | undefined) ??
    'https://pawfectmatch.app/terms',
  privacy:
    (import.meta.env.VITE_LEGAL_PRIVACY_URL as string | undefined) ??
    'https://pawfectmatch.app/privacy',
} as const;
