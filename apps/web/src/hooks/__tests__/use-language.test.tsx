import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  useLanguage,
  useLanguageValue,
  useTranslation,
  useIsRTL,
  type UseLanguageReturn
} from '../use-language'

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }))
}))

// Mock the i18n types
vi.mock('@/lib/i18n', () => ({
  Language: {} as any,
}))

describe('useLanguage', () => {
  beforeEach(() => {
    // Mock localStorage methods only
    vi.spyOn(Storage.prototype, 'getItem')
    vi.spyOn(Storage.prototype, 'setItem')

    // Mock navigator language
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      writable: true,
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with English as default language', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe('en')
    expect(result.current.isRTL).toBe(false)
    expect(result.current.supportedLanguages).toEqual(['en', 'bg'])
    expect(typeof result.current.setLanguage).toBe('function')
  })

  it('should load stored language from localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('bg')

    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe('bg')
    expect(localStorage.getItem).toHaveBeenCalledWith('petspark-language')
  })

  it('should detect browser language when no stored language', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    Object.defineProperty(window.navigator, 'language', {
      value: 'bg-BG',
      writable: true,
    })

    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe('bg')
  })

  it('should fallback to English for unsupported browser language', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    Object.defineProperty(window.navigator, 'language', {
      value: 'fr-FR',
      writable: true,
    })

    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe('en')
  })

  it('should set language and store it in localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const { result } = renderHook(() => useLanguage())

    act(() => {
      result.current.setLanguage('bg')
    })

    expect(result.current.language).toBe('bg')
    expect(localStorage.setItem).toHaveBeenCalledWith('petspark-language', 'bg')
  })

  it('should update document language when language changes', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const { result } = renderHook(() => useLanguage())

    act(() => {
      result.current.setLanguage('bg')
    })

    expect(document.documentElement.lang).toBe('bg')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('should return consistent supported languages', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const { result } = renderHook(() => useLanguage())

    expect(result.current.supportedLanguages).toEqual(['en', 'bg'])
    expect(Object.isFrozen(result.current.supportedLanguages)).toBe(false)
  })

  it('should always return false for isRTL (no RTL languages supported)', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)

    const { result } = renderHook(() => useLanguage())

    expect(result.current.isRTL).toBe(false)

    act(() => {
      result.current.setLanguage('bg')
    })

    expect(result.current.isRTL).toBe(false)
  })
})

describe('useLanguageValue', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      writable: true,
    })
  })

  it('should return just the language value', () => {
    const { result } = renderHook(() => useLanguageValue())

    expect(result.current).toBe('en')
    expect(typeof result.current).toBe('string')
  })
})

describe('useTranslation', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      writable: true,
    })
  })

  it('should return translation function and language', () => {
    const { result } = renderHook(() => useTranslation())

    expect(typeof result.current.t).toBe('function')
    expect(result.current.language).toBe('en')
  })

  it('should return key as translation (placeholder implementation)', () => {
    const { result } = renderHook(() => useTranslation())

    expect(result.current.t('hello.world')).toBe('hello.world')
    expect(result.current.t('submit.button')).toBe('submit.button')
  })
})

describe('useIsRTL', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      writable: true,
    })
  })

  it('should return false for all languages', () => {
    const { result } = renderHook(() => useIsRTL())

    expect(result.current).toBe(false)
  })
})
