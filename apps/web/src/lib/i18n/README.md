# i18n System Documentation

## Overview

The i18n (internationalization) system provides type-safe translation hooks with support for lazy loading, nested keys, parameter interpolation, and proper error handling.

## Features

- ✅ **Type-safe translations** - Full TypeScript support
- ✅ **Multiple API options** - Object-based and function-based APIs
- ✅ **Lazy loading** - Code splitting support for better performance
- ✅ **Nested keys** - Support for dot notation (`app.nav.discover`)
- ✅ **Parameter interpolation** - Dynamic values in translations (`Welcome {{name}}!`)
- ✅ **Error handling** - Graceful fallbacks and structured logging
- ✅ **Performance** - Memoization and caching
- ✅ **Backward compatible** - Existing code continues to work

## API Reference

### `useTranslation(lang?: Language): TranslationModule`

Basic translation hook that returns the translations object directly. Maintains backward compatibility.

```typescript
import { useTranslation } from '@/lib/i18n';

const t = useTranslation('en');
const title = t['app']['title']; // 'PawfectMatch'
const navText = t['nav']['discover']; // 'Discover'
```

**Parameters:**

- `lang` - Language code (`'en'` | `'bg'`). Defaults to `'en'`.

**Returns:**

- `TranslationModule` - The translations object for the specified language

### `useTranslationFunction(lang?: Language): UseTranslationReturn`

Enhanced translation hook with function-based API supporting nested keys and parameter interpolation.

```typescript
import { useTranslationFunction } from '@/lib/i18n';

const { t, translations, isLoading, language } = useTranslationFunction('en');

// Nested keys
const title = t('app.title'); // 'PawfectMatch'

// Parameter interpolation
const greeting = t('welcome.message', { name: 'John' }); // 'Welcome John!'
const count = t('welcome.greeting', { name: 'Jane', count: 5 }); // 'Hello Jane, you have 5 messages'
```

**Parameters:**

- `lang` - Language code (`'en'` | `'bg'`). Defaults to `'en'`.

**Returns:**

- `t` - Translation function `(key: string, params?: Record<string, string | number>) => string`
- `translations` - The translations object
- `isLoading` - Always `false` (synchronous loading)
- `language` - Current language code

### `useLazyTranslation(lang?: Language): UseLazyTranslationReturn`

Advanced translation hook with lazy loading for code splitting. Loads translations dynamically and provides loading/error states.

```typescript
import { useLazyTranslation } from '@/lib/i18n'

const { t, translations, isLoading, language, error } = useLazyTranslation('bg')

if (isLoading) {
  return <Loading />
}

if (error) {
  return <Error message={error.message} />
}

return <div>{t('app.title')}</div>
```

**Parameters:**

- `lang` - Language code (`'en'` | `'bg'`). Defaults to `'en'`.

**Returns:**

- `t` - Translation function
- `translations` - The translations object (falls back to legacy translations on error)
- `isLoading` - `true` while loading translations
- `language` - Current language code
- `error` - Error object if loading failed, `null` otherwise

**Features:**

- Automatically cancels previous requests when language changes
- Falls back to legacy translations on error
- Proper cleanup with AbortController

## Translation Key Format

### Nested Keys

Use dot notation to access nested translation values:

```typescript
// Translation structure:
{
  app: {
    title: 'PawfectMatch',
    nav: {
      discover: 'Discover',
      matches: 'Matches'
    }
  }
}

// Access with dot notation:
t('app.title') // 'PawfectMatch'
t('app.nav.discover') // 'Discover'
```

### Parameter Interpolation

Use `{{paramName}}` placeholders in translation strings:

```typescript
// Translation:
{
  welcome: {
    message: 'Welcome {{name}}!',
    greeting: 'Hello {{name}}, you have {{count}} messages'
  }
}

// Usage:
t('welcome.message', { name: 'John' }) // 'Welcome John!'
t('welcome.greeting', { name: 'Jane', count: 5 }) // 'Hello Jane, you have 5 messages'
```

**Note:** If a parameter is missing, the placeholder remains unchanged:

```typescript
t('welcome.message', {}); // 'Welcome {{name}}!'
t('welcome.message'); // 'Welcome {{name}}!'
```

## Language Support

Currently supported languages:

- `'en'` - English (default)
- `'bg'` - Bulgarian

## Fallback Behavior

1. **Missing translation key**: Returns the key itself
2. **Missing language**: Falls back to English (`'en'`)
3. **Lazy loading error**: Falls back to legacy translations object
4. **Missing parameter**: Placeholder remains in the string

## Error Handling

All errors are logged using structured logging (`createLogger`). No `console.*` calls are made in production code.

### Translation Key Not Found

```typescript
const value = t('nonexistent.key');
// Returns: 'nonexistent.key'
// Logs: warn('Translation key not found', { key: 'nonexistent.key', language: 'en' })
```

### Lazy Loading Error

```typescript
const { t, error } = useLazyTranslation('bg');

if (error) {
  // Error logged via logger.error()
  // Falls back to legacy translations
  // Component can still render with fallback translations
}
```

## Performance Considerations

### Memoization

All hooks use `useMemo` to prevent unnecessary re-renders:

- Translation objects are memoized based on language
- Translation functions are memoized based on translations and language
- Return values are memoized to maintain referential equality

### Caching

The lazy loader (`loadAllTranslations`) uses an in-memory cache:

- Translations are cached per language/feature combination
- Cache persists for the lifetime of the application
- Use `clearTranslationCache()` to clear the cache if needed

### Code Splitting

Use `useLazyTranslation` for code splitting:

- Translations are loaded on-demand
- Reduces initial bundle size
- Better for applications with many translation files

## Migration Guide

### From Legacy Object API

**Before:**

```typescript
const t = useTranslation('en');
const title = t.app.title;
```

**After (still works):**

```typescript
const t = useTranslation('en');
const title = t['app']['title']; // Use bracket notation for type safety
```

**Or use function API:**

```typescript
const { t } = useTranslationFunction('en');
const title = t('app.title'); // Cleaner and type-safe
```

### Adding Parameter Interpolation

**Before:**

```typescript
const message = `Welcome ${name}!`;
```

**After:**

```typescript
// In translation file:
// welcome: { message: 'Welcome {{name}}!' }

const { t } = useTranslationFunction('en');
const message = t('welcome.message', { name });
```

## Best Practices

1. **Use function API for new code** - Better type safety and parameter interpolation
2. **Keep translation keys consistent** - Use dot notation for nested structures
3. **Handle loading states** - Use `isLoading` from `useLazyTranslation` when appropriate
4. **Provide fallbacks** - Always have English translations as fallback
5. **Test translations** - Ensure all keys exist in all languages
6. **Use structured logging** - Never use `console.*` in production code

## Examples

### Basic Usage

```typescript
import { useTranslation } from '@/lib/i18n'

function MyComponent() {
  const t = useTranslation('en')

  return (
    <div>
      <h1>{t['app']['title']}</h1>
      <nav>
        <a href="/discover">{t['nav']['discover']}</a>
      </nav>
    </div>
  )
}
```

### Function API with Parameters

```typescript
import { useTranslationFunction } from '@/lib/i18n'

function WelcomeMessage({ userName }: { userName: string }) {
  const { t } = useTranslationFunction('en')

  return (
    <div>
      <h1>{t('welcome.message', { name: userName })}</h1>
      <p>{t('welcome.description', { count: 5 })}</p>
    </div>
  )
}
```

### Lazy Loading with Error Handling

```typescript
import { useLazyTranslation } from '@/lib/i18n'

function LocalizedComponent() {
  const { t, isLoading, error } = useLazyTranslation('bg')

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.description')}</p>
    </div>
  )
}
```

### Language Switching

```typescript
import { useLanguage } from '@/hooks/useLanguage'
import { useTranslationFunction } from '@/lib/i18n'

function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage()
  const { t } = useTranslationFunction(language)

  return (
    <button onClick={toggleLanguage}>
      {t('settings.changeLanguage')}
    </button>
  )
}
```

## Testing

See `useTranslation.test.ts` for comprehensive test examples covering:

- Basic translation retrieval
- Nested key access
- Parameter interpolation
- Error handling
- Lazy loading
- Language switching
- Edge cases

## Type Definitions

```typescript
export type Language = 'en' | 'bg';

export interface TranslationModule {
  readonly [key: string]: string | TranslationModule;
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

export interface UseTranslationReturn {
  t: TranslationFunction;
  translations: TranslationModule;
  isLoading: boolean;
  language: Language;
}

export interface UseLazyTranslationReturn extends UseTranslationReturn {
  error: Error | null;
}
```

## Related Files

- `hooks/useTranslation.ts` - Main translation hooks
- `core/loader.ts` - Dynamic translation loader
- `core/types.ts` - Type definitions
- `hooks/useTranslation.test.ts` - Test suite
