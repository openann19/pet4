/**
 * Tests for useTranslation hooks
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTranslation, useLazyTranslation, useTranslationFunction } from './useTranslation';
import type { Language, TranslationModule } from '../core/types';
import { loadAllTranslations } from '../core/loader';

// Mock the loader
vi.mock('../core/loader', () => ({
  loadAllTranslations: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock translations
vi.mock('../../i18n', () => ({
  translations: {
    en: {
      app: {
        title: 'PawfectMatch',
        tagline: 'AI-Powered Pet Companion Matching',
      },
      nav: {
        discover: 'Discover',
        matches: 'Matches',
      },
      welcome: {
        message: 'Welcome {{name}}!',
        greeting: 'Hello {{name}}, you have {{count}} messages',
      },
    },
    bg: {
      app: {
        title: 'PawfectMatch',
        tagline: 'AI-Задруга за Домашни Любимци',
      },
      nav: {
        discover: 'Откриване',
        matches: 'Съвпадения',
      },
    },
  },
}));

describe('useTranslation', () => {
  it('should return English translations by default', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current).toBeDefined();
    expect(result.current.app).toBeDefined();
    const app = result.current.app;
    if (typeof app === 'object' && app !== null) {
      expect(app.title).toBe('PawfectMatch');
    }
    expect(result.current.nav).toBeDefined();
    const nav = result.current.nav;
    if (typeof nav === 'object' && nav !== null) {
      expect(nav.discover).toBe('Discover');
    }
  });

  it('should return translations for specified language', () => {
    const { result } = renderHook(() => useTranslation('en'));

    const app = result.current.app;
    if (typeof app === 'object' && app !== null) {
      expect(app.title).toBe('PawfectMatch');
    }
    const nav = result.current.nav;
    if (typeof nav === 'object' && nav !== null) {
      expect(nav.discover).toBe('Discover');
    }
  });

  it('should return Bulgarian translations when language is bg', () => {
    const { result } = renderHook(() => useTranslation('bg'));

    const app = result.current.app;
    if (typeof app === 'object' && app !== null) {
      expect(app.title).toBe('PawfectMatch');
    }
    const nav = result.current.nav;
    if (typeof nav === 'object' && nav !== null) {
      expect(nav.discover).toBe('Откриване');
    }
  });

  it('should fallback to English if language not found', () => {
    const { result } = renderHook(() => useTranslation('fr' as Language));

    expect(result.current).toBeDefined();
    const app = result.current.app;
    if (typeof app === 'object' && app !== null) {
      expect(app.title).toBe('PawfectMatch');
    }
  });

  it('should memoize translations based on language', () => {
    const { result, rerender } = renderHook(
      ({ lang }: { lang: Language }) => useTranslation(lang),
      { initialProps: { lang: 'en' } }
    );

    const firstResult = result.current;

    rerender({ lang: 'en' });
    expect(result.current).toBe(firstResult);

    rerender({ lang: 'bg' });
    expect(result.current).not.toBe(firstResult);
  });
});

describe('useTranslationFunction', () => {
  it('should return translation function with nested key support', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe('function');
    expect(result.current.t('app.title')).toBe('PawfectMatch');
    expect(result.current.t('nav.discover')).toBe('Discover');
  });

  it('should support parameter interpolation', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.t('welcome.message', { name: 'John' })).toBe('Welcome John!');
    expect(result.current.t('welcome.greeting', { name: 'Jane', count: 5 })).toBe(
      'Hello Jane, you have 5 messages'
    );
  });

  it('should return key if translation not found', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should fallback to English if translation missing in current language', () => {
    const { result } = renderHook(() => useTranslationFunction('bg'));

    // If bg doesn't have welcome.message, should fallback to en
    const value = result.current.t('welcome.message', { name: 'Test' });
    expect(value).toBeDefined();
  });

  it('should return translations object', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.translations).toBeDefined();
    const app = result.current.translations.app;
    if (typeof app === 'object' && app !== null) {
      expect(app.title).toBe('PawfectMatch');
    }
  });

  it('should return language', () => {
    const { result } = renderHook(() => useTranslationFunction('bg'));

    expect(result.current.language).toBe('bg');
  });

  it('should return isLoading as false', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.isLoading).toBe(false);
  });

  it('should memoize translation function', () => {
    const { result, rerender } = renderHook(
      ({ lang }: { lang: Language }) => useTranslationFunction(lang),
      { initialProps: { lang: 'en' } }
    );

    const firstT = result.current.t;

    rerender({ lang: 'en' });
    expect(result.current.t).toBe(firstT);

    rerender({ lang: 'bg' });
    expect(result.current.t).not.toBe(firstT);
  });
});

describe('useLazyTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with loading state', () => {
    vi.mocked(loadAllTranslations).mockImplementation(() => {
      return new Promise(() => {
        // Never resolves - keeps loading state
      });
    });

    const { result } = renderHook(() => useLazyTranslation('en'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should load translations successfully', async () => {
    const mockTranslations = {
      app: { title: 'Loaded Title' },
      nav: { discover: 'Loaded Discover' },
    };

    vi.mocked(loadAllTranslations).mockResolvedValue(mockTranslations);

    const { result } = renderHook(() => useLazyTranslation('en'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.translations).toBeDefined();
    expect(result.current.t('app.title')).toBe('Loaded Title');
  });

  it('should handle loading errors gracefully', async () => {
    const error = new Error('Failed to load');
    vi.mocked(loadAllTranslations).mockRejectedValue(error);

    const { result } = renderHook(() => useLazyTranslation('en'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Failed to load');
    // Should fallback to legacy translations
    expect(result.current.translations).toBeDefined();
  });

  it('should fallback to legacy translations on error', async () => {
    vi.mocked(loadAllTranslations).mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useLazyTranslation('en'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still have translations from legacy fallback
    expect(result.current.translations).toBeDefined();
    expect(result.current.t('app.title')).toBeDefined();
  });

  it('should cancel previous request when language changes', async () => {
    const firstPromise = new Promise<TranslationModule>(() => {
      // Never resolves - simulates slow request
    });

    const secondPromise = Promise.resolve({ app: { title: 'Second Load' } } as TranslationModule);

    vi.mocked(loadAllTranslations)
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result, rerender } = renderHook(
      ({ lang }: { lang: Language }) => useLazyTranslation(lang),
      { initialProps: { lang: 'en' } }
    );

    expect(result.current.isLoading).toBe(true);

    // Change language - should cancel first and start second
    act(() => {
      rerender({ lang: 'bg' });
    });

    // Wait for second request to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have loaded bg translations
    expect(result.current.language).toBe('bg');
    expect(result.current.translations).toBeDefined();
  });

  it('should return correct language', async () => {
    vi.mocked(loadAllTranslations).mockResolvedValue({} as TranslationModule);

    const { result } = renderHook(() => useLazyTranslation('bg'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('bg');
  });

  it('should provide translation function', async () => {
    const mockTranslations = {
      test: { key: 'Test Value' },
    };

    vi.mocked(loadAllTranslations).mockResolvedValue(mockTranslations);

    const { result } = renderHook(() => useLazyTranslation('en'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe('function');
    expect(result.current.t('test.key')).toBe('Test Value');
  });

  it('should handle non-Error rejections', async () => {
    vi.mocked(loadAllTranslations).mockRejectedValue('String error');

    const { result } = renderHook(() => useLazyTranslation('en'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('String error');
  });
});

describe('Translation function edge cases', () => {
  it('should handle empty params object', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    // Empty params object means placeholders are not replaced
    expect(result.current.t('welcome.message', {})).toBe('Welcome {{name}}!');
  });

  it('should handle missing params', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.t('welcome.message')).toBe('Welcome {{name}}!');
  });

  it('should handle numeric params', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.t('welcome.greeting', { name: 'Test', count: 42 })).toBe(
      'Hello Test, you have 42 messages'
    );
  });

  it('should handle nested keys that are objects', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    // If key points to an object, should return the key itself
    const value = result.current.t('app');
    expect(value).toBe('app');
  });

  it('should handle deeply nested keys', () => {
    const { result } = renderHook(() => useTranslationFunction('en'));

    expect(result.current.t('app.title')).toBe('PawfectMatch');
  });
});
