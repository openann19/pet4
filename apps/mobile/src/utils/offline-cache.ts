/**
 * Offline Cache Utilities
 *
 * Provides MMKV-based caching for offline feed and chat support.
 * Mirrors web Service Worker caching strategy.
 *
 * Location: apps/mobile/src/utils/offline-cache.ts
 *
 * Required dependency:
 * - react-native-mmkv
 */

import { createLogger } from './logger'
import { secureStorage } from './secure-storage'
import type { MMKVConstructor, MMKVInstance, MMKVModule } from '@/types/mmkv'
import { importOptional } from './optional-imports'

const logger = createLogger('offline-cache')

const ENCRYPTION_KEY_STORAGE_KEY = 'petspark_mmkv_encryption_key'

function isMMKVModule(module: unknown): module is MMKVModule {
  return typeof module === 'object' && module !== null && ('MMKV' in module || 'default' in module)
}

// Lazy load MMKV (optional dependency)
let MMKV: MMKVConstructor | null = null
let kv: MMKVInstance | null = null

async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key from secure storage
    const existingKey = await secureStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY)
    if (existingKey) {
      return existingKey
    }

    // Generate new encryption key
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Store in secure storage
    await secureStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, newKey)
    return newKey
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get or create encryption key', err)
    // Fallback to a default key (not ideal, but better than crashing)
    return 'petspark-offline-key-fallback'
  }
}

async function initMMKV(): Promise<boolean> {
  try {
    if (!MMKV) {
      const mmkvModule = await importOptional<MMKVModule>('react-native-mmkv', isMMKVModule)
      if (mmkvModule) {
        MMKV = mmkvModule.MMKV ?? mmkvModule.default ?? null
      }
      if (!MMKV) {
        return false
      }
    }
    if (!kv && MMKV) {
      const encryptionKey = await getOrCreateEncryptionKey()
      kv = new MMKV({
        id: 'petspark-offline-cache',
        encryptionKey,
      })
    }
    return kv !== null
  } catch {
    logger.warn('MMKV not available, using fallback storage')
    return false
  }
}

/**
 * Set cached value
 *
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 */
export async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    const initialized = await initMMKV()
    if (!initialized || !kv) {
      logger.warn('MMKV not available, cache set skipped')
      return
    }

    const json = JSON.stringify(value)
    kv.set(key, json)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to cache value', err, { key })
  }
}

/**
 * Get cached value
 *
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const initialized = await initMMKV()
    if (!initialized || !kv) {
      return null
    }

    const json = kv.getString(key)
    if (!json) return null
    return JSON.parse(json) as T
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get cached value', err, { key })
    return null
  }
}

/**
 * Delete cached value
 *
 * @param key - Cache key
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const initialized = await initMMKV()
    if (!initialized || !kv) {
      return
    }

    kv.delete(key)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to delete cached value', err, { key })
  }
}

/**
 * Clear all cached values
 */
export async function cacheClear(): Promise<void> {
  try {
    const initialized = await initMMKV()
    if (!initialized || !kv) {
      return
    }

    kv.clearAll()
    logger.info('Cache cleared')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to clear cache', err)
  }
}

/**
 * Check if key exists in cache
 *
 * @param key - Cache key
 * @returns true if key exists
 */
export async function cacheHas(key: string): Promise<boolean> {
  try {
    const initialized = await initMMKV()
    if (!initialized || !kv) {
      return false
    }

    return kv.contains(key)
  } catch {
    return false
  }
}

/**
 * Get all keys in cache
 *
 * @returns Array of cache keys
 */
export async function cacheKeys(): Promise<string[]> {
  try {
    const initialized = await initMMKV()
    if (!initialized || !kv) {
      return []
    }

    return kv.getAllKeys()
  } catch {
    return []
  }
}
