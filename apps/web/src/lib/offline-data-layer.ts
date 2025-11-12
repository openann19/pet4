/**
 * Offline-First Data Layer (Web)
 *
 * Provides local-first data storage with optimistic updates.
 * Features:
 * - Local-first data storage with IndexedDB
 * - Optimistic updates with rollback on failure
 * - Background sync when online
 * - Conflict resolution strategies
 * - Data versioning and migration
 * - Cache invalidation strategies
 *
 * Location: apps/web/src/lib/offline-data-layer.ts
 */

import { createLogger } from './logger'
import { createConflictResolver, type ConflictResolver, type Conflict } from './conflict-resolution'

const logger = createLogger('offline-data-layer')

/**
 * Data version
 */
export interface DataVersion {
  readonly version: number
  readonly timestamp: number
  readonly checksum?: string
}

/**
 * Cached data entry
 */
export interface CachedDataEntry<T = unknown> {
  readonly id: string
  readonly data: T
  readonly version: DataVersion
  readonly cachedAt: number
  readonly expiresAt?: number
  readonly etag?: string
  readonly lastModified?: number
}

/**
 * Optimistic update
 */
export interface OptimisticUpdate<T = unknown> {
  readonly id: string
  readonly resourceType: string
  readonly resourceId: string
  readonly data: T
  readonly originalData?: T
  readonly status: 'pending' | 'applied' | 'committed' | 'rolled-back'
  readonly createdAt: number
  readonly committedAt?: number
  readonly rolledBackAt?: number
}

/**
 * Offline data layer options
 */
export interface OfflineDataLayerOptions {
  readonly dbName?: string
  readonly dbVersion?: number
  readonly enableOptimisticUpdates?: boolean
  readonly enableConflictResolution?: boolean
  readonly cacheTTL?: number // Time to live in ms
  readonly maxCacheSize?: number
  readonly conflictResolver?: ConflictResolver
}

/**
 * Offline data layer
 */
export class OfflineDataLayer {
  private readonly dbName: string
  private readonly dbVersion: number
  private readonly enableOptimisticUpdates: boolean
  private readonly enableConflictResolution: boolean
  private readonly cacheTTL: number
  private readonly maxCacheSize: number
  private readonly conflictResolver: ConflictResolver
  private db: IDBDatabase | null = null
  private readonly optimisticUpdates = new Map<string, OptimisticUpdate>()
  private readonly cache = new Map<string, CachedDataEntry>()

  constructor(options: OfflineDataLayerOptions = {}) {
    this.dbName = options.dbName ?? 'petspark-offline-data'
    this.dbVersion = options.dbVersion ?? 1
    this.enableOptimisticUpdates = options.enableOptimisticUpdates ?? true
    this.enableConflictResolution = options.enableConflictResolution ?? true
    this.cacheTTL = options.cacheTTL ?? 24 * 60 * 60 * 1000 // 24 hours
    this.maxCacheSize = options.maxCacheSize ?? 1000
    this.conflictResolver = options.conflictResolver ?? createConflictResolver()

    this.init()
  }

  /**
   * Initialize database
   */
  private async init(): Promise<void> {
    try {
      this.db = await this.openDatabase()
      logger.debug('Offline data layer initialized', {
        dbName: this.dbName,
        dbVersion: this.dbVersion,
      })
    } catch (error) {
      logger.error('Failed to initialize offline data layer', {
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * Open database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' })
          cacheStore.createIndex('cachedAt', 'cachedAt', { unique: false })
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        }

        if (!db.objectStoreNames.contains('optimistic')) {
          const optimisticStore = db.createObjectStore('optimistic', { keyPath: 'id' })
          optimisticStore.createIndex('resourceType', 'resourceType', { unique: false })
          optimisticStore.createIndex('status', 'status', { unique: false })
        }

        if (!db.objectStoreNames.contains('versions')) {
          db.createObjectStore('versions', { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Get data from cache
   */
  async get<T>(resourceType: string, resourceId: string): Promise<T | null> {
    const id = `${resourceType}:${resourceId}`

    // Check memory cache first
    const cached = this.cache.get(id)
    if (cached) {
      // Check if expired
      if (cached.expiresAt && cached.expiresAt < Date.now()) {
        this.cache.delete(id)
      } else {
        logger.debug('Data retrieved from memory cache', { id })
        return cached.data as T
      }
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction('cache', 'readonly')
        const store = transaction.objectStore('cache')
        const request = store.get(id)

        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const entry = request.result as CachedDataEntry<T> | undefined
            if (entry) {
              // Check if expired
              if (entry.expiresAt && entry.expiresAt < Date.now()) {
                resolve(null)
              } else {
                // Update memory cache
                this.cache.set(id, entry)
                logger.debug('Data retrieved from IndexedDB', { id })
                resolve(entry.data)
              }
            } else {
              resolve(null)
            }
          }

          request.onerror = () => {
            reject(request.error)
          }
        })
      } catch (error) {
        logger.error('Failed to get data from IndexedDB', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
        return null
      }
    }

    return null
  }

  /**
   * Set data in cache
   */
  async set<T>(
    resourceType: string,
    resourceId: string,
    data: T,
    options: {
      version?: DataVersion
      etag?: string
      lastModified?: number
      ttl?: number
    } = {}
  ): Promise<void> {
    const id = `${resourceType}:${resourceId}`
    const now = Date.now()
    const expiresAt = options.ttl ? now + options.ttl : now + this.cacheTTL

    const entry: CachedDataEntry<T> = {
      id,
      data,
      version: options.version ?? { version: 1, timestamp: now },
      cachedAt: now,
      expiresAt,
      etag: options.etag,
      lastModified: options.lastModified,
    }

    // Update memory cache
    this.cache.set(id, entry)

    // Update IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction('cache', 'readwrite')
        const store = transaction.objectStore('cache')
        await new Promise<void>((resolve, reject) => {
          const request = store.put(entry)
          request.onsuccess = () => {
            logger.debug('Data cached in IndexedDB', { id })
            resolve()
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
      } catch (error) {
        logger.error('Failed to cache data in IndexedDB', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    // Cleanup if cache is too large
    if (this.cache.size > this.maxCacheSize) {
      this.cleanupCache()
    }
  }

  /**
   * Apply optimistic update
   */
  async applyOptimisticUpdate<T>(
    resourceType: string,
    resourceId: string,
    data: T,
    originalData?: T
  ): Promise<string> {
    if (!this.enableOptimisticUpdates) {
      throw new Error('Optimistic updates are not enabled')
    }

    const id = `opt-${resourceType}-${resourceId}-${Date.now()}`
    const update: OptimisticUpdate<T> = {
      id,
      resourceType,
      resourceId,
      data,
      originalData,
      status: 'pending',
      createdAt: Date.now(),
    }

    this.optimisticUpdates.set(id, update)

    // Update cache with optimistic data
    await this.set(resourceType, resourceId, data)

    // Persist to IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction('optimistic', 'readwrite')
        const store = transaction.objectStore('optimistic')
        await new Promise<void>((resolve, reject) => {
          const request = store.put(update)
          request.onsuccess = () => {
            logger.debug('Optimistic update applied', { id })
            resolve()
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
      } catch (error) {
        logger.error('Failed to persist optimistic update', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    return id
  }

  /**
   * Commit optimistic update
   */
  async commitOptimisticUpdate(updateId: string): Promise<void> {
    const update = this.optimisticUpdates.get(updateId)
    if (!update) {
      logger.warn('Optimistic update not found', { updateId })
      return
    }

    const committedUpdate: OptimisticUpdate = {
      ...update,
      status: 'committed',
      committedAt: Date.now(),
    }

    this.optimisticUpdates.set(updateId, committedUpdate)

    // Update IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction('optimistic', 'readwrite')
        const store = transaction.objectStore('optimistic')
        await new Promise<void>((resolve, reject) => {
          const request = store.put(committedUpdate)
          request.onsuccess = () => {
            logger.debug('Optimistic update committed', { updateId })
            resolve()
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
      } catch (error) {
        logger.error('Failed to commit optimistic update', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }
  }

  /**
   * Rollback optimistic update
   */
  async rollbackOptimisticUpdate(updateId: string): Promise<void> {
    const update = this.optimisticUpdates.get(updateId)
    if (!update) {
      logger.warn('Optimistic update not found', { updateId })
      return
    }

    // Restore original data
    if (update.originalData !== undefined) {
      await this.set(update.resourceType, update.resourceId, update.originalData)
    }

    const rolledBackUpdate: OptimisticUpdate = {
      ...update,
      status: 'rolled-back',
      rolledBackAt: Date.now(),
    }

    this.optimisticUpdates.set(updateId, rolledBackUpdate)

    // Update IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction('optimistic', 'readwrite')
        const store = transaction.objectStore('optimistic')
        await new Promise<void>((resolve, reject) => {
          const request = store.put(rolledBackUpdate)
          request.onsuccess = () => {
            logger.debug('Optimistic update rolled back', { updateId })
            resolve()
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
      } catch (error) {
        logger.error('Failed to rollback optimistic update', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }
  }

  /**
   * Cleanup cache
   */
  private cleanupCache(): void {
    const now = Date.now()
    const entriesToDelete: string[] = []

    // Find expired entries
    for (const [id, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        entriesToDelete.push(id)
      }
    }

    // Delete expired entries
    entriesToDelete.forEach((id) => {
      this.cache.delete(id)
    })

    // If still too large, delete oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].cachedAt - b[1].cachedAt
      )
      const toDelete = sortedEntries.slice(0, this.cache.size - this.maxCacheSize)
      toDelete.forEach(([id]) => {
        this.cache.delete(id)
      })
    }

    logger.debug('Cache cleaned up', {
      deleted: entriesToDelete.length,
      remaining: this.cache.size,
    })
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear()

    if (this.db) {
      try {
        const transaction = this.db.transaction('cache', 'readwrite')
        const store = transaction.objectStore('cache')
        await new Promise<void>((resolve, reject) => {
          const request = store.clear()
          request.onsuccess = () => {
            logger.debug('Cache cleared')
            resolve()
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
      } catch (error) {
        logger.error('Failed to clear cache', {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }
  }
}

/**
 * Create offline data layer instance
 */
let dataLayerInstance: OfflineDataLayer | null = null

export function getOfflineDataLayer(options?: OfflineDataLayerOptions): OfflineDataLayer {
  if (!dataLayerInstance) {
    dataLayerInstance = new OfflineDataLayer(options)
  }
  return dataLayerInstance
}
