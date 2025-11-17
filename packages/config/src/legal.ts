/**
 * Legal URLs Configuration
 *
 * Centralized configuration for legal document URLs (terms, privacy policy).
 * Supports environment-specific URLs via environment variables.
 * Works for both Next.js (NEXT_PUBLIC_*) and Vite (VITE_*) environments.
 */

export const LEGAL_URLS = {
  terms:
    (typeof process !== 'undefined' &&
      typeof process.env !== 'undefined' &&
      process.env.NEXT_PUBLIC_LEGAL_TERMS_URL) ??
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> })?.env?.VITE_LEGAL_TERMS_URL) ??
    'https://pawfectmatch.app/terms',
  privacy:
    (typeof process !== 'undefined' &&
      typeof process.env !== 'undefined' &&
      process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL) ??
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> })?.env?.VITE_LEGAL_PRIVACY_URL) ??
    'https://pawfectmatch.app/privacy',
} as const;
