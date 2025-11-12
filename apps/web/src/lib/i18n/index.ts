/**
 * i18n Module
 *
 * Main entry point for translations
 * Provides backward compatibility while supporting modular structure
 */

// Re-export types
export type { Language, TranslationModule, TranslationKey } from './core/types';

// Re-export hooks
export { useTranslation, useLazyTranslation, useTranslationFunction } from './hooks/useTranslation';
export type {
  TranslationFunction,
  UseTranslationReturn,
  UseLazyTranslationReturn,
} from './hooks/useTranslation';

// Re-export loader functions
export { loadTranslationModule, loadAllTranslations, clearTranslationCache } from './core/loader';
