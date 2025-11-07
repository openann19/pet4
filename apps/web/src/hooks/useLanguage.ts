import { useStorage } from '@/hooks/useStorage'
import type { Language} from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n'

export function useLanguage() {
  const [language, setLanguage] = useStorage<Language>('app-language', 'en')
  const t = useTranslation(language || 'en')

  const toggleLanguage = () => {
    setLanguage((current) => (current || 'en') === 'en' ? 'bg' : 'en')
  }

  return { 
    language: language || 'en', 
    setLanguage, 
    toggleLanguage, 
    t 
  }
}
