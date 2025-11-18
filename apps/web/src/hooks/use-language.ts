/**
 * useLanguage Hook - Language management with persistence and type safety
 */

import * as React from 'react'

const { useState, useEffect, useCallback } = React
import { createLogger } from '@/lib/logger'
import { type Language } from '@/lib/i18n'

const logger = createLogger('useLanguage')

// Storage key for language persistence
const LANGUAGE_STORAGE_KEY = 'petspark-language'

// Get stored language or detect from browser
const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language
    if (stored && ['en', 'bg'].includes(stored)) {
      return stored
    }
  } catch (_error) {
    logger.warn('Failed to read language from localStorage', { _error })
  }
  
  // Try to detect from browser
  try {
    const browserLang = navigator.language.split('-')[0] as Language
    if (['en', 'bg'].includes(browserLang)) {
      return browserLang
    }
  } catch (_error) {
    logger.warn('Failed to detect browser language', { _error })
  }
  
  return 'en'
}

// Store language preference
const storeLanguage = (language: Language): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch (_error) {
    logger.warn('Failed to store language in localStorage', { _error })
  }
}

export interface UseLanguageReturn {
  readonly language: Language
  readonly setLanguage: (language: Language) => void
  readonly isRTL: boolean
  readonly supportedLanguages: readonly Language[]
}

/**
 * Hook to access and manage language state
 */
export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage)
  
  // Apply language changes to document
  useEffect(() => {
    // Set document language and direction
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
      document.documentElement.dir = 'ltr' // No RTL languages supported yet
      
      logger.info('Language applied to document', { language })
    }
  }, [language])
  
  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage)
    storeLanguage(newLanguage)
    
    logger.info('Language changed', { from: language, to: newLanguage })
  }, [language])
  
  const supportedLanguages: readonly Language[] = ['en', 'bg'] as const
  
  return {
    language,
    setLanguage,
    isRTL: false, // No RTL languages supported yet
    supportedLanguages
  }
}

/**
 * Hook to get just the current language value
 */
export function useLanguageValue(): Language {
  const { language } = useLanguage()
  return language
}

/**
 * Hook to get the translation function
 * For now, this is a placeholder since translation system is not fully integrated
 */
export function useTranslation() {
  const { language } = useLanguage()
  
  // Simple translation function - in real app would use proper i18n system
  const t = (key: string) => key
  
  return { t, language }
}

/**
 * Hook to check if current language is RTL
 */
export function useIsRTL(): boolean {
  const { isRTL } = useLanguage()
  return isRTL
}