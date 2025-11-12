/**
 * Storage Service
 *
 * Unified storage API using IndexedDB for large data and localStorage for small config.
 * Replaces legacy KV functionality.
 */

import { createLogger } from './logger';

const logger = createLogger('StorageService');

const DB_NAME = 'petspark-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv-store';
const LOCAL_STORAGE_PREFIX = 'petspark:';
const MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024; // 5MB threshold
const hasIndexedDBSupport = typeof indexedDB !== 'undefined';

// Keys that should always use localStorage (small config values)
const LOCALSTORAGE_KEYS = new Set([
  'app-language',
  'theme',
  'notification-preferences',
  'last-notification-check',
  'has-seen-welcome-v2',
  'is-authenticated',
  'data-initialized',
]);

interface StorageItem<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
}

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private inMemoryCache = new Map<string, { value: unknown; timestamp: number }>();
  private cacheTTL = 5000; // 5 seconds
  private broadcastChannel: BroadcastChannel | null = null;
  private isInitialized = false;
  private indexedDBUnavailableLogged = false;

  /**
   * Initialize IndexedDB with resilience features
   */
  async initDB(): Promise<void> {
    if (!hasIndexedDBSupport) {
      if (!this.indexedDBUnavailableLogged) {
        logger.debug('IndexedDB not available; falling back to localStorage-only mode');
        this.indexedDBUnavailableLogged = true;
      }

      this.initPromise ??= Promise.resolve();

      this.isInitialized = true;
      this.db = null;
      return;
    }

    if (this.db && this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        const error = request.error ?? new Error('Failed to open IndexedDB');
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to open IndexedDB', errorObj);
        reject(errorObj);
      };

      request.onsuccess = () => {
        this.db = request.result;

        // Listen for database close events
        this.db.onclose = () => {
          logger.warn('IndexedDB connection closed unexpectedly', {
            dbName: DB_NAME,
            version: DB_VERSION,
          });
          this.db = null;
          this.isInitialized = false;
          this.initPromise = null;
          // Re-initialize on next access
        };

        // Listen for version change events (database upgrade in another tab)
        this.db.onversionchange = () => {
          logger.warn('IndexedDB version change detected, closing connection', {
            dbName: DB_NAME,
            oldVersion: this.db?.version,
          });
          this.db?.close();
          this.db = null;
          this.isInitialized = false;
          this.initPromise = null;
          // Clear cache on version change
          this.inMemoryCache.clear();
          // Broadcast invalidation to other tabs
          this.broadcastInvalidation();
          // Re-initialize on next access
        };

        this.isInitialized = true;
        this.setupBroadcastChannel();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Setup broadcast channel for multi-tab cache invalidation
   */
  private setupBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      logger.warn('BroadcastChannel not supported, cache invalidation disabled');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel('petspark-storage');

      this.broadcastChannel.onmessage = (event) => {
        const { type, key } = event.data as { type: string; key?: string };

        if (type === 'invalidate') {
          if (isTruthy(key)) {
            // Invalidate specific key
            this.inMemoryCache.delete(key);
            logger.debug(`Cache invalidated for key: ${key}`);
          } else {
            // Invalidate all cache
            this.inMemoryCache.clear();
            logger.debug('Cache invalidated (all keys)');
          }
        } else if (type === 'update') {
          // Another tab updated a value, invalidate our cache immediately
          if (key) {
            this.inMemoryCache.delete(key);
            logger.debug(`Cache invalidated for key: ${key} (external update)`);
          } else {
            // If no key specified, clear all cache
            this.inMemoryCache.clear();
            logger.debug('Cache invalidated (all keys, external update)');
          }
        }
      };
    } catch (error) {
      logger.warn('Failed to setup broadcast channel', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Broadcast cache invalidation to other tabs
   */
  private broadcastInvalidation(key?: string): void {
    if (isTruthy(this.broadcastChannel)) {
      try {
        this.broadcastChannel.postMessage({ type: 'invalidate', key });
      } catch (error) {
        logger.warn('Failed to broadcast cache invalidation', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Broadcast update to other tabs
   */
  private broadcastUpdate(key: string): void {
    if (isTruthy(this.broadcastChannel)) {
      try {
        this.broadcastChannel.postMessage({ type: 'update', key });
      } catch (error) {
        logger.warn('Failed to broadcast update', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Check if a key should use localStorage
   */
  private shouldUseLocalStorage(key: string): boolean {
    return LOCALSTORAGE_KEYS.has(key) || key.length < 50;
  }

  /**
   * Estimate size of a value in bytes
   */
  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get value from localStorage
   */
  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      logger.warn(`Failed to read from localStorage for key ${key}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Set value in localStorage
   */
  private setToLocalStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      logger.warn(`Failed to write to localStorage for key ${key}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete value from localStorage
   */
  private deleteFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    } catch (error) {
      logger.warn(`Failed to delete from localStorage for key ${key}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get value from IndexedDB with error recovery
   */
  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!hasIndexedDBSupport) {
      return null;
    }

    if (!this.db || !this.isInitialized) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => {
        const error = request.error ?? new Error('Failed to read from IndexedDB');
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error(`Failed to read from IndexedDB for key ${key}`, errorObj);

        // Attempt to recover by re-initializing
        if (this.db) {
          this.db.close();
          this.db = null;
          this.isInitialized = false;
          this.initPromise = null;
        }

        reject(errorObj);
      };

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;
        resolve(item ? item.value : null);
      };
    });
  }

  /**
   * Set value in IndexedDB with error recovery
   */
  private async setToIndexedDB<T>(key: string, value: T): Promise<void> {
    if (!hasIndexedDBSupport) {
      return;
    }

    if (!this.db || !this.isInitialized) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
      };
      const request = store.put(item);

      request.onerror = () => {
        const error = request.error ?? new Error('Failed to write to IndexedDB');
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error(`Failed to write to IndexedDB for key ${key}`, errorObj);

        // Attempt to recover by re-initializing
        if (this.db) {
          this.db.close();
          this.db = null;
          this.isInitialized = false;
          this.initPromise = null;
        }

        reject(errorObj);
      };

      request.onsuccess = () => {
        // Broadcast update to other tabs
        this.broadcastUpdate(key);
        resolve();
      };
    });
  }

  /**
   * Delete value from IndexedDB
   */
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!hasIndexedDBSupport) {
      return;
    }

    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => {
        const error = request.error ?? new Error('Failed to delete from IndexedDB');
        const errorObj = error instanceof Error ? error : new Error(String(error));
        reject(errorObj);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Get all keys from storage
   */
  async keys(): Promise<string[]> {
    const keys: string[] = [];

    // Get keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        keys.push(key.substring(LOCAL_STORAGE_PREFIX.length));
      }
    }

    // Get keys from IndexedDB
    try {
      if (isTruthy(hasIndexedDBSupport)) {
        if (!this.db) {
          await this.initDB();
        }

        if (this.db) {
          const transaction = this.db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.openCursor();

          await new Promise<void>((resolve, reject) => {
            request.onerror = () => {
              const error = request.error ?? new Error('Failed to iterate IndexedDB');
              const errorObj = error instanceof Error ? error : new Error(String(error));
              reject(errorObj);
            };
            request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
              if (cursor) {
                const item = cursor.value as StorageItem;
                keys.push(item.key);
                cursor.continue();
              } else {
                resolve();
              }
            };
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to get keys from IndexedDB', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return [...new Set(keys)]; // Remove duplicates
  }

  /**
   * Get a value from storage
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    // Check in-memory cache first
    const cached = this.inMemoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value as T;
    }

    let value: T | null = null;

    if (this.shouldUseLocalStorage(key)) {
      value = this.getFromLocalStorage<T>(key);
    } else {
      try {
        value = await this.getFromIndexedDB<T>(key);
      } catch (error) {
        logger.warn(`Failed to read from IndexedDB for key ${key}, falling back to localStorage`, {
          error: error instanceof Error ? error.message : String(error),
        });
        value = this.getFromLocalStorage<T>(key);
      }
    }

    // Cache the result
    if (value !== null && value !== undefined) {
      this.inMemoryCache.set(key, { value, timestamp: Date.now() });
    }

    return value ?? undefined;
  }

  /**
   * Set a value in storage
   * Returns a promise that resolves when the value is persisted
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    // Update in-memory cache
    this.inMemoryCache.set(key, { value, timestamp: Date.now() });

    const size = this.estimateSize(value);

    if (this.shouldUseLocalStorage(key) || size < MAX_LOCALSTORAGE_SIZE) {
      this.setToLocalStorage(key, value);
      // Also store in IndexedDB as backup for large localStorage keys
      if (size >= MAX_LOCALSTORAGE_SIZE) {
        try {
          await this.setToIndexedDB(key, value);
        } catch (error) {
          logger.warn(`Failed to write to IndexedDB for key ${key}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      // Broadcast invalidation to other tabs
      this.broadcastInvalidation(key);
    } else {
      try {
        await this.setToIndexedDB(key, value);
        // Broadcast invalidation to other tabs
        this.broadcastInvalidation(key);
      } catch (error) {
        logger.warn(`Failed to write to IndexedDB for key ${key}, falling back to localStorage`, {
          error: error instanceof Error ? error.message : String(error),
        });
        this.setToLocalStorage(key, value);
        // Broadcast invalidation to other tabs
        this.broadcastInvalidation(key);
      }
    }
  }

  /**
   * Delete a value from storage
   */
  async delete(key: string): Promise<void> {
    // Remove from cache
    this.inMemoryCache.delete(key);

    // Delete from both storages
    this.deleteFromLocalStorage(key);
    try {
      await this.deleteFromIndexedDB(key);
    } catch (error) {
      logger.warn(`Failed to delete from IndexedDB for key ${key}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Broadcast invalidation to other tabs
    this.broadcastInvalidation(key);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    // Clear cache
    this.inMemoryCache.clear();

    // Clear localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear IndexedDB
    try {
      if (isTruthy(hasIndexedDBSupport)) {
        if (!this.db) {
          await this.initDB();
        }

        if (this.db) {
          const transaction = this.db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          await new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => {
              const error = request.error ?? new Error('Failed to clear IndexedDB');
              const errorObj = error instanceof Error ? error : new Error(String(error));
              reject(errorObj);
            };
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to clear IndexedDB', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Export singleton instance
export const storage = new StorageService();

// Initialize on module load (but don't block)
if (typeof window !== 'undefined') {
  // Initialize asynchronously to avoid blocking
  storage.initDB().catch((error) => {
    logger.warn('Failed to initialize IndexedDB, using localStorage only', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}
