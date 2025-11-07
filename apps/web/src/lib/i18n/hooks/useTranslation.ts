/**
 * Translation Hook
 * 
 * Main hook for accessing translations with lazy loading support
 * Provides type-safe translation access with proper error handling and fallbacks
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import type { Language, TranslationModule } from '../core/types'
import { loadAllTranslations } from '../core/loader'
import { translations } from '../../i18n'
import { createLogger } from '@/lib/logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('useTranslation')

/**
 * Type-safe translation function that supports nested keys
 */
export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string

/**
 * Hook return type with translation function and loading state
 */
export interface UseTranslationReturn {
  t: TranslationFunction
  translations: TranslationModule
  isLoading: boolean
  language: Language
}

/**
 * Hook return type for lazy translation hook
 */
export interface UseLazyTranslationReturn extends UseTranslationReturn {
  error: Error | null
}

/**
 * Enhanced translation hook with function-based API
 * Provides a translation function `t` that supports nested keys and parameter interpolation
 * 
 * @param lang - Language code ('en' | 'bg')
 * @returns Translation function, translations object, loading state, and language
 * 
 * @example
 * ```tsx
 * const { t, translations, isLoading, language } = useTranslationFunction('en')
 * const title = t('app.title')
 * const greeting = t('welcome.message', { name: 'John' })
 * ```
 */
export function useTranslationFunction(lang: Language = 'en'): UseTranslationReturn {
  const language = useMemo(() => lang, [lang])
  const fallbackModule = useMemo(() => translations.en, [])
  const currentModule = useTranslation(language)

  const t = useMemo(
    () => createTranslationFunction(currentModule, language, fallbackModule),
    [currentModule, language, fallbackModule]
  )

  return useMemo(
    () => ({
      t,
      translations: currentModule,
      isLoading: false,
      language
    }),
    [t, currentModule, language]
  )
}

/**
 * Get nested value from translation object using dot notation
 */
function getNestedValue(
  obj: TranslationModule,
  path: string
): string | TranslationModule | undefined {
  const keys = path.split('.')
  let current: string | TranslationModule | undefined = obj

  for (const key of keys) {
    if (current === undefined || typeof current !== 'object') {
      return undefined
    }
    // At this point, current is guaranteed to be TranslationModule
    // Access via index signature with proper type handling
    const module: TranslationModule = current
    const next = module[key]
    if (next === undefined) {
      return undefined
    }
    current = next
  }

  return current
}

/**
 * Replace placeholders in translation string with parameters
 */
function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return template
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = params[key]
    return value !== undefined ? String(value) : match
  })
}

/**
 * Create translation function from translation module
 */
function createTranslationFunction(
  module: TranslationModule,
  language: Language,
  fallbackModule?: TranslationModule
): TranslationFunction {
  return (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(module, key)

    // Fallback to English if translation missing
    if (value === undefined && language !== 'en' && fallbackModule) {
      value = getNestedValue(fallbackModule, key)
    }

    // If still undefined, return the key itself
    if (value === undefined) {
      logger.warn('Translation key not found', { key, language })
      return key
    }

    // If value is a string, interpolate and return
    if (typeof value === 'string') {
      return interpolate(value, params)
    }

    // If value is an object, return the key (shouldn't happen but handle gracefully)
    logger.warn('Translation value is not a string', { key, language, valueType: typeof value })
    return key
  }
}

/**
 * Enhanced translation hook with proper error handling and type safety
 * Maintains backward compatibility by returning the translations object directly
 * 
 * @param lang - Language code ('en' | 'bg')
 * @returns TranslationModule - The translations object for the specified language
 * 
 * @example
 * ```tsx
 * const t = useTranslation('en')
 * const title = t.app.title
 * const navText = t.nav.discover
 * ```
 */
export function useTranslation(lang: Language = 'en'): TranslationModule {
  const language = useMemo(() => lang, [lang])
  const fallbackModule = useMemo(() => translations.en, [])
  
  return useMemo(() => {
    const module = translations[language] ?? fallbackModule
    
    if (!module) {
      logger.warn('Translation module not found, using fallback', { language })
      return fallbackModule
    }
    
    return module
  }, [language, fallbackModule])
}

/**
 * Advanced translation hook with lazy loading and error handling
 * 
 * Loads translations dynamically for better code splitting and performance.
 * Falls back to legacy translations on error or during loading.
 * 
 * @param lang - Language code ('en' | 'bg')
 * @returns Translation function, translations object, loading state, language, and error
 * 
 * @example
 * ```tsx
 * const { t, isLoading, error } = useLazyTranslation('bg')
 * if (isLoading) return <Loading />
 * if (error) return <Error message={error.message} />
 * return <div>{t('app.title')}</div>
 * ```
 */
export function useLazyTranslation(lang: Language = 'en'): UseLazyTranslationReturn {
  const language = useMemo(() => lang, [lang])
  const [loadedTranslations, setLoadedTranslations] = useState<TranslationModule | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fallbackModule = useMemo(() => translations.en, [])
  const legacyModule = useMemo(() => translations[language] || fallbackModule, [language, fallbackModule])

  useEffect(() => {
    // Cancel previous request if language changes
    if (isTruthy(abortControllerRef.current)) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setError(null)

    loadAllTranslations(language)
      .then((translations) => {
        if (isTruthy(abortController.signal.aborted)) {
          return
        }

        setLoadedTranslations(translations)
        setIsLoading(false)
        logger.info('Translations loaded successfully', { language })
      })
      .catch((err) => {
        if (isTruthy(abortController.signal.aborted)) {
          return
        }

        const error = err instanceof Error ? err : new Error(String(err))
        logger.error('Failed to load translations', error, { language })
        
        setError(error)
        setLoadedTranslations(null)
        setIsLoading(false)
      })

    return () => {
      abortController.abort()
    }
  }, [language])

  const currentModule = useMemo(
    () => loadedTranslations ?? legacyModule,
    [loadedTranslations, legacyModule]
  )

  const t = useMemo(
    () => createTranslationFunction(currentModule, language, fallbackModule),
    [currentModule, language, fallbackModule]
  )

  return useMemo(
    () => ({
      t,
      translations: currentModule,
      isLoading,
      language,
      error
    }),
    [t, currentModule, isLoading, language, error]
  )
}
