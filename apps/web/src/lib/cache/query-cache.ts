import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Query Cache - In-memory cache for API responses with TTL support
 * Provides efficient caching with automatic expiration and size management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 100;

export class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isTruthy(isExpired)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry with optional custom TTL
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    // Enforce cache size limit using LRU (delete oldest)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  stats(): {
    size: number;
    maxSize: number;
    entries: { key: string; age: number; ttl: number }[];
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries,
    };
  }
}

// Global cache instance
export const queryCache = new QueryCache({
  ttl: DEFAULT_TTL,
  maxSize: DEFAULT_MAX_SIZE,
});

// Utility function for cache key generation
export function generateCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) {
    return endpoint;
  }
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${String(key ?? '')}=${String(JSON.stringify(params[key]) ?? '')}`)
    .join('&');
  return `${String(endpoint ?? '')}?${String(sortedParams ?? '')}`;
}
