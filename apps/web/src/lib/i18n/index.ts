import type { Language } from './types';
import { commonTranslations } from './translations/common';
import { authTranslations } from './translations/auth';
import { chatTranslations } from './translations/chat';
import { discoverTranslations } from './translations/discover';
import { profileTranslations } from './translations/profile';
import { adminTranslations } from './translations/admin';
import { communityTranslations } from './translations/community';
import { adoptionTranslations } from './translations/adoption';

export type { Language } from './types';

/**
 * Merged translations object combining all domain-specific translations
 */
export const translations = {
  en: {
    ...commonTranslations.en,
    ...authTranslations.en,
    ...chatTranslations.en,
    ...discoverTranslations.en,
    ...profileTranslations.en,
    ...adminTranslations.en,
    ...communityTranslations.en,
    ...adoptionTranslations.en,
  },
  bg: {
    ...commonTranslations.bg,
    ...authTranslations.bg,
    ...chatTranslations.bg,
    ...discoverTranslations.bg,
    ...profileTranslations.bg,
    ...adminTranslations.bg,
    ...communityTranslations.bg,
    ...adoptionTranslations.bg,
  },
} as const;

/**
 * Hook to get translations for a specific language
 */
export function useTranslation(lang: Language) {
  return translations[lang];
}
