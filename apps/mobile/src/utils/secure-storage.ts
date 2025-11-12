/**
 * Ultra-Premium Secure Storage Utilities
 *
 * Production-grade secure storage with:
 * - Type-safe keychain access configurations
 * - In-memory caching for frequently accessed values
 * - Batch operations support
 * - Key validation and namespace support
 * - Size limits and input sanitization
 * - Retry logic for transient failures
 * - Key existence checking
 * - Comprehensive error handling
 *
 * Location: src/utils/secure-storage.ts
 */

import * as SecureStore from 'expo-secure-store'
import { createLogger } from './logger'

const logger = createLogger('secureStorage')

// Constants
const MAX_KEY_LENGTH = 128
const MAX_VALUE_SIZE = 2 * 1024 * 1024 // 2MB
const KEY_PREFIX = 'pawfect_'
const DEFAULT_RETRY_ATTEMPTS = 3
const DEFAULT_RETRY_DELAY_MS = 100

// Cache for frequently accessed values (LRU-like, max 50 entries)
interface CacheEntry {
  value: string
  timestamp: number
}

const valueCache = new Map<string, CacheEntry>()
const MAX_CACHE_SIZE = 50
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Keychain accessibility constants (properly typed)
export const KeychainAccessibility = {
  WHEN_UNLOCKED: SecureStore.WHEN_UNLOCKED,
  AFTER_FIRST_UNLOCK: SecureStore.AFTER_FIRST_UNLOCK,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
} as const

export type KeychainAccessibilityType =
  | typeof KeychainAccessibility.WHEN_UNLOCKED
   
   
   
   

export interface SecureStorageOptions {
  keychainAccessible?: KeychainAccessibilityType
  requireAuthentication?: boolean
  authenticationPrompt?: string
  skipCache?: boolean
  retryAttempts?: number
  retryDelayMs?: number
}

export interface SecureStorageError extends Error {
  code: 'INVALID_KEY' | 'INVALID_VALUE' | 'SIZE_EXCEEDED' | 'STORAGE_ERROR' | 'NETWORK_ERROR'
  key?: string
  originalError?: Error
}

const DEFAULT_OPTIONS: Required<
  Omit<
    SecureStorageOptions,
    'keychainAccessible' | 'requireAuthentication' | 'authenticationPrompt'
  >
> = {
  skipCache: false,
  retryAttempts: DEFAULT_RETRY_ATTEMPTS,
  retryDelayMs: DEFAULT_RETRY_DELAY_MS,
}

/**
 * Validate key format and length
 */
function validateKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw createError('INVALID_KEY', 'Key must be a non-empty string', { key })
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw createError('INVALID_KEY', `Key exceeds maximum length of ${String(MAX_KEY_LENGTH ?? '')}`, { key })
  }

  // Ensure key uses safe characters (alphanumeric, underscore, dash, dot)
  if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
    throw createError('INVALID_KEY', 'Key contains invalid characters', { key })
  }
}

/**
 * Calculate UTF-8 byte length of a string
 */
function getByteLength(value: string): number {
  // Use TextEncoder if available (React Native 0.70+), otherwise fallback to length estimation
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length
  }

  // Fallback: estimate UTF-8 bytes (most characters are 1-3 bytes)
  let length = 0
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i)
    if (charCode < 0x80) {
      length += 1
    } else if (charCode < 0x800) {
      length += 2
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      length += 3
    } else {
      // Surrogate pair
      i++
      length += 4
    }
  }
  return length
}

/**
 * Validate value format and size
 */
function validateValue(value: string): void {
  if (typeof value !== 'string') {
    throw createError('INVALID_VALUE', 'Value must be a string', {})
  }

  const sizeBytes = getByteLength(value)
  if (sizeBytes > MAX_VALUE_SIZE) {
    throw createError('SIZE_EXCEEDED', `Value exceeds maximum size of ${String(MAX_VALUE_SIZE ?? '')} bytes`, {
      sizeBytes,
    })
  }
}

/**
 * Create normalized key with prefix
 */
function normalizeKey(key: string): string {
  return key.startsWith(KEY_PREFIX) ? key : `${String(KEY_PREFIX ?? '')}${String(key ?? '')}`
}

/**
 * Create structured error
 */
function createError(
  code: SecureStorageError['code'],
  message: string,
  context: { key?: string; originalError?: Error; [key: string]: unknown }
): SecureStorageError {
  const error = new Error(message) as SecureStorageError
  error.code = code
  error.name = 'SecureStorageError'
  if (context.key !== undefined) {
    error.key = context.key
  }
  if (context.originalError !== undefined) {
    error.originalError = context.originalError
  }
  return error
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry operation with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  attempts: number = DEFAULT_RETRY_ATTEMPTS,
  delayMs: number = DEFAULT_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on validation errors
      if (lastError instanceof Error && 'code' in lastError) {
        const storageError = lastError as SecureStorageError
        if (
          storageError.code === 'INVALID_KEY' ||
          storageError.code === 'INVALID_VALUE' ||
          storageError.code === 'SIZE_EXCEEDED'
        ) {
          throw lastError
        }
      }

      if (attempt < attempts - 1) {
        const backoffDelay = delayMs * Math.pow(2, attempt)
        await sleep(backoffDelay)
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Clean expired cache entries
 */
function cleanCache(): void {
  const now = Date.now()
  const entries = Array.from(valueCache.entries())

  for (const [key, entry] of entries) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      valueCache.delete(key)
    }
  }

  // If still over limit, remove oldest entries
  if (valueCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(valueCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    )

    const toRemove = sortedEntries.slice(0, valueCache.size - MAX_CACHE_SIZE)
    for (const [key] of toRemove) {
      valueCache.delete(key)
    }
  }
}

/**
 * Get value from cache if available and not expired
 */
function getCachedValue(key: string): string | null {
  cleanCache()
  const entry = valueCache.get(key)

  if (!entry) {
    return null
  }

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL_MS) {
    valueCache.delete(key)
    return null
  }

  return entry.value
}

/**
 * Set value in cache
 */
function setCachedValue(key: string, value: string): void {
  cleanCache()
  valueCache.set(key, {
    value,
    timestamp: Date.now(),
  })
}

/**
 * Clear value from cache
 */
function clearCachedValue(key: string): void {
  valueCache.delete(key)
}

/**
 * Build secure store options from user options
 */
function buildSecureOptions(options: SecureStorageOptions = {}): SecureStore.SecureStoreOptions {
  const secureOptions: SecureStore.SecureStoreOptions = {}

  if (options.keychainAccessible !== undefined) {
    secureOptions.keychainAccessible = options.keychainAccessible
  }

  if (options.requireAuthentication !== undefined) {
    secureOptions.requireAuthentication = options.requireAuthentication
  }

  if (options.authenticationPrompt !== undefined) {
    secureOptions.authenticationPrompt = options.authenticationPrompt
  }

  return secureOptions
}

/**
 * Save a value securely with enhanced error handling and validation
 */
export async function saveSecureValue(
  key: string,
  value: string,
  options: SecureStorageOptions = {}
): Promise<void> {
  validateKey(key)
  validateValue(value)

  const normalizedKey = normalizeKey(key)
  const secureOptions = buildSecureOptions(options)
  const retryAttempts = options.retryAttempts ?? DEFAULT_OPTIONS.retryAttempts
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_OPTIONS.retryDelayMs

  try {
    await withRetry(
      async () => {
        await SecureStore.setItemAsync(normalizedKey, value, secureOptions)
      },
      retryAttempts,
      retryDelayMs
    )

    // Update cache if not skipping
    if (!options.skipCache) {
      setCachedValue(normalizedKey, value)
    } else {
      clearCachedValue(normalizedKey)
    }

    logger.debug('Secure value saved', { key: normalizedKey, sizeBytes: getByteLength(value) })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const storageError = createError('STORAGE_ERROR', 'Failed to save secure value', {
      key: normalizedKey,
      originalError: err,
    })

    logger.error('Failed to save secure value', storageError, { key: normalizedKey })
    throw storageError
  }
}

/**
 * Get a value securely with caching support
 */
export async function getSecureValue(
  key: string,
  options: SecureStorageOptions = {}
): Promise<string | null> {
  validateKey(key)

  const normalizedKey = normalizeKey(key)
  const retryAttempts = options.retryAttempts ?? DEFAULT_OPTIONS.retryAttempts
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_OPTIONS.retryDelayMs

  // Check cache first if not skipping
  if (!options.skipCache) {
    const cached = getCachedValue(normalizedKey)
    if (cached !== null) {
      logger.debug('Secure value retrieved from cache', { key: normalizedKey })
      return cached
    }
  }

  try {
    const value = await withRetry(
      () => SecureStore.getItemAsync(normalizedKey),
      retryAttempts,
      retryDelayMs
    )

    // Update cache if not skipping and value exists
    if (!options.skipCache && value !== null) {
      setCachedValue(normalizedKey, value)
    }

    logger.debug('Secure value retrieved', { key: normalizedKey, hasValue: value !== null })
    return value
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const storageError = createError('STORAGE_ERROR', 'Failed to get secure value', {
      key: normalizedKey,
      originalError: err,
    })

    logger.error('Failed to get secure value', storageError, { key: normalizedKey })
    return null
  }
}

/**
 * Delete a secure value
 */
export async function deleteSecureValue(
  key: string,
  options: SecureStorageOptions = {}
): Promise<void> {
  validateKey(key)

  const normalizedKey = normalizeKey(key)
  const retryAttempts = options.retryAttempts ?? DEFAULT_OPTIONS.retryAttempts
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_OPTIONS.retryDelayMs

  try {
    await withRetry(
      async () => {
        await SecureStore.deleteItemAsync(normalizedKey)
      },
      retryAttempts,
      retryDelayMs
    )

    // Clear from cache
    clearCachedValue(normalizedKey)

    logger.debug('Secure value deleted', { key: normalizedKey })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const storageError = createError('STORAGE_ERROR', 'Failed to delete secure value', {
      key: normalizedKey,
      originalError: err,
    })

    logger.error('Failed to delete secure value', storageError, { key: normalizedKey })
    throw storageError
  }
}

/**
 * Check if a key exists in secure storage
 */
export async function hasSecureValue(key: string): Promise<boolean> {
  validateKey(key)

  const normalizedKey = normalizeKey(key)

  try {
    const value = await getSecureValue(normalizedKey, { skipCache: true })
    return value !== null
  } catch {
    return false
  }
}

/**
 * Get multiple values in batch
 */
export async function getMultipleSecureValues(
  keys: readonly string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()

  await Promise.all(
    keys.map(async key => {
      try {
        const value = getSecureValue(key)
        results.set(key, await value)
      } catch {
        results.set(key, null)
      }
    })
  )

  return results
}

/**
 * Save multiple values in batch
 */
export async function saveMultipleSecureValues(
  entries: ReadonlyArray<{ key: string; value: string }>,
  options: SecureStorageOptions = {}
): Promise<void> {
  await Promise.all(entries.map(({ key, value }) => saveSecureValue(key, value, options)))
}

/**
 * Delete multiple values in batch
 */
export async function deleteMultipleSecureValues(keys: readonly string[]): Promise<void> {
  await Promise.all(
    keys.map(key =>
      deleteSecureValue(key).catch(() => {
        // Ignore individual failures in batch delete
      })
    )
  )
}

/**
 * Clear all cached values (does not clear secure storage)
 */
export function clearCache(): void {
  valueCache.clear()
  logger.debug('Cache cleared')
}

/**
 * Save auth token securely with optimized settings
 */
export async function saveAuthToken(token: string): Promise<void> {
  await saveSecureValue('auth_token', token, {
    keychainAccessible: KeychainAccessibility.WHEN_UNLOCKED,
    requireAuthentication: false,
    skipCache: false, // Cache auth tokens for fast access
  })
}

/**
 * Get auth token securely
 */
export function getAuthToken(): Promise<string | null> {
  return getSecureValue('auth_token')
}

/**
 * Delete auth token
 */
export async function deleteAuthToken(): Promise<void> {
  await deleteSecureValue('auth_token')
}

/**
 * Check if auth token exists
 */
export function hasAuthToken(): Promise<boolean> {
  return hasSecureValue('auth_token')
}

/**
 * Save refresh token securely with the same guarantees as the access token
 */
export async function saveRefreshToken(token: string): Promise<void> {
  await saveSecureValue('refresh_token', token, {
    keychainAccessible: KeychainAccessibility.WHEN_UNLOCKED,
    requireAuthentication: false,
    skipCache: false,
  })
}

/**
 * Get refresh token securely
 */
export function getRefreshToken(): Promise<string | null> {
  return getSecureValue('refresh_token')
}

/**
 * Delete refresh token
 */
export async function deleteRefreshToken(): Promise<void> {
  await deleteSecureValue('refresh_token')
}

/**
 * Check if a refresh token exists
 */
export function hasRefreshToken(): Promise<boolean> {
  return hasSecureValue('refresh_token')
}

/**
 * Secure storage interface with getItem/setItem/removeItem methods for compatibility
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const result = await getSecureValue(key)
    return result
  },

  async setItem(key: string, value: string): Promise<void> {
    await saveSecureValue(key, value)
  },

  async removeItem(key: string): Promise<void> {
    await deleteSecureValue(key)
  },

  async hasItem(key: string): Promise<boolean> {
    const result = await hasSecureValue(key)
    return result
  },

  clearCache,
} as const
