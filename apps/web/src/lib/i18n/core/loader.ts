/**
 * Dynamic Translation Loader
 *
 * Loads translation modules on-demand for better performance
 */

import type { Language, TranslationModule } from './types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TranslationLoader');

const translationCache = new Map<string, TranslationModule>();

/**
 * Load translation module for a feature
 */
export async function loadTranslationModule(
  language: Language,
  feature: string
): Promise<TranslationModule> {
  const cacheKey = `${language}:${feature}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Dynamic import based on feature
    const module = (await import(`../locales/${language}/${feature}.ts`)) as {
      default?: TranslationModule;
      [key: string]: TranslationModule | undefined;
    };

    const translations = module.default ?? module[feature];

    if (translations && typeof translations === 'object') {
      translationCache.set(cacheKey, translations);
      return translations;
    }

    throw new Error(`Translation module not found: ${feature}`);
  } catch (_error) {
    // Fallback to empty object if module doesn't exist
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.warn('Failed to load translation module', { feature, language, _error: err.message });
    return {};
  }
}

/**
 * Load all translation modules for a language
 */
export async function loadAllTranslations(language: Language): Promise<TranslationModule> {
  const features = [
    'common',
    'navigation',
    'discover',
    'matches',
    'chat',
    'community',
    'adoption',
    'lost-found',
    'profile',
    'admin',
    'errors',
  ];

  const modules = await Promise.all(
    features.map((feature) => loadTranslationModule(language, feature))
  );

  // Merge all modules with proper type safety
  const merged: TranslationModule = {} as TranslationModule;
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const module = modules[i];
    if (feature && module) {
      // Type assertion needed because TranslationModule has readonly index signature
      // but we need to write to it during construction
      Object.assign(merged, { [feature]: module });
    }
  }

  return merged;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
