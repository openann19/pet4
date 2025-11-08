import { useStorage } from '@/hooks/use-storage';
import type { Language } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';

export function useLanguage(): {
  language: Language;
  setLanguage: (value: Language | ((prev: Language) => Language)) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: ReturnType<typeof useTranslation>;
} {
  const [language, setLanguage] = useStorage<Language>('app-language', 'en');
  const t = useTranslation(language || 'en');

  const toggleLanguage = async (): Promise<void> => {
    await setLanguage((current) => ((current || 'en') === 'en' ? 'bg' : 'en'));
  };

  return {
    language: language || 'en',
    setLanguage,
    toggleLanguage,
    t,
  };
}
