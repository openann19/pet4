/**
 * Regional Formatting Utilities (Mobile)
 * 
 * Provides locale-aware formatting for dates, numbers, currency, and more
 */

import { createLogger } from './logger'

const logger = createLogger('RegionalFormatting')

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko'

export interface RegionalSettings {
  language: Language
  locale: string
  currency: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  numberFormat: {
    decimalSeparator: string
    thousandsSeparator: string
  }
  rtl: boolean
}

/**
 * Regional settings per language
 */
const REGIONAL_SETTINGS = {
  en: {
    language: 'en' as Language,
    locale: 'en-US',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rtl: false
  },
  bg: {
    language: 'bg' as Language,
    locale: 'bg-BG',
    currency: 'BGN',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: ' '
    },
    rtl: false
  },
  es: {
    language: 'es' as Language,
    locale: 'es-ES',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: '.'
    },
    rtl: false
  },
  fr: {
    language: 'fr' as Language,
    locale: 'fr-FR',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: ' '
    },
    rtl: false
  },
  de: {
    language: 'de' as Language,
    locale: 'de-DE',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: '.'
    },
    rtl: false
  },
  ja: {
    language: 'ja' as Language,
    locale: 'ja-JP',
    currency: 'JPY',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rtl: false
  },
  zh: {
    language: 'zh' as Language,
    locale: 'zh-CN',
    currency: 'CNY',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rtl: false
  },
  ar: {
    language: 'ar' as Language,
    locale: 'ar-SA',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rtl: true
  },
  hi: {
    language: 'hi' as Language,
    locale: 'hi-IN',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rtl: false
  },
  pt: {
    language: 'pt' as Language,
    locale: 'pt-BR',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: '.'
    },
    rtl: false
  },
  ru: {
    language: 'ru' as Language,
    locale: 'ru-RU',
    currency: 'RUB',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: ' '
    },
    rtl: false
  },
  ko: {
    language: 'ko' as Language,
    locale: 'ko-KR',
    currency: 'KRW',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rtl: false
  }
} as const satisfies Record<string, RegionalSettings>

/**
 * Get regional settings for a language
 */
export function getRegionalSettings(language = 'en'): RegionalSettings {
  const settings = REGIONAL_SETTINGS[language as keyof typeof REGIONAL_SETTINGS]
  if (!settings) {
    return REGIONAL_SETTINGS.en
  }
  return settings
}

/**
 * Format currency according to regional settings
 */
export function formatCurrency(
  amount: number,
  language: string = 'en',
  options?: {
    currency?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  const settings = getRegionalSettings(language)
  const currency = options?.currency ?? settings.currency

  try {
    // Use Intl.NumberFormat for currency formatting
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2
    }).format(amount)
  } catch (error) {
    logger.warn('Failed to format currency, using fallback', { amount, language, error })
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Format number according to regional settings
 */
export function formatNumber(
  value: number,
  language: string = 'en',
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  const settings = getRegionalSettings(language)

  try {
    return new Intl.NumberFormat(settings.locale, {
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2
    }).format(value)
  } catch (error) {
    logger.warn('Failed to format number, using fallback', { value, language, error })
    return value.toString()
  }
}

/**
 * Format date according to regional settings
 */
export function formatDate(
  date: Date | string | number,
  language: string = 'en',
  options?: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
    includeTime?: boolean
  }
): string {
  const settings = getRegionalSettings(language)
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date

  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      dateStyle: options?.dateStyle ?? 'medium'
    }

    if (options?.includeTime) {
      formatOptions.timeStyle = options?.timeStyle ?? 'short'
    }

    return new Intl.DateTimeFormat(settings.locale, formatOptions).format(dateObj)
  } catch (error) {
    logger.warn('Failed to format date, using fallback', { date, language, error })
    return dateObj.toLocaleDateString()
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  language: string = 'en'
): string {
  const settings = getRegionalSettings(language)
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date

  try {
    const rtf = new Intl.RelativeTimeFormat(settings.locale, { numeric: 'auto' })
    const now = new Date()
    const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000)

    const intervals = [
      { unit: 'year' as const, seconds: 31536000 },
      { unit: 'month' as const, seconds: 2592000 },
      { unit: 'week' as const, seconds: 604800 },
      { unit: 'day' as const, seconds: 86400 },
      { unit: 'hour' as const, seconds: 3600 },
      { unit: 'minute' as const, seconds: 60 }
    ]

    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds)
      if (count >= 1) {
        return rtf.format(-count, interval.unit)
      }
    }

    return rtf.format(0, 'second')
  } catch (error) {
    logger.warn('Failed to format relative time, using fallback', { date, language, error })
    return 'just now'
  }
}

/**
 * Check if language uses RTL layout
 */
export function isRTL(language: string): boolean {
  return getRegionalSettings(language).rtl
}

/**
 * Get locale string for a language
 */
export function getLocale(language: string): string {
  return getRegionalSettings(language).locale
}

