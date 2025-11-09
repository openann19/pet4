/**
 * Skia Surface Cache for Chat Effects
 *
 * Caches offscreen surfaces for reuse across frames.
 * Pre-rasterizes heavy layers and reuses textures to improve performance.
 *
 * Location: apps/mobile/src/effects/chat/core/surface-cache.ts
 */

import { Skia, type SkSurface } from '@shopify/react-native-skia'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('surface-cache')

/**
 * Cached surface entry
 */
interface CachedSurface {
  surface: SkSurface
  width: number
  height: number
  lastUsed: number
  useCount: number
}

/**
 * Surface cache manager
 * Manages offscreen surfaces for reuse across frames
 */
class SurfaceCache {
  private cache: Map<string, CachedSurface> = new Map()
  private maxCacheSize: number = 10 // Maximum number of cached surfaces
  private maxAgeMs: number = 60000 // 60 seconds max age
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Start cleanup interval (clean up every 10 seconds)
    this.startCleanup()
  }

  /**
   * Get or create a cached surface
   *
   * @param key - Unique key for the surface
   * @param width - Surface width
   * @param height - Surface height
   * @returns Cached or new surface
   */
  getSurface(key: string, width: number, height: number): SkSurface {
    const cached = this.cache.get(key)

    // Check if cached surface matches dimensions
    if (cached && cached.width === width && cached.height === height) {
      cached.lastUsed = Date.now()
      cached.useCount++
      logger.debug('Surface cache hit', { key, width, height })
      return cached.surface
    }

    // Create new surface
    logger.debug('Creating new surface', { key, width, height })
    const surface = Skia.Surface.Make(width, height)

    if (!surface) {
      throw new Error(`Failed to create Skia surface: ${key} (${width}x${height})`)
    }

    // Cache the surface
    this.cache.set(key, {
      surface,
      width,
      height,
      lastUsed: Date.now(),
      useCount: 1,
    })

    // Clean up if cache is too large
    this.cleanupIfNeeded()

    return surface
  }

  /**
   * Release a surface (mark as unused)
   */
  releaseSurface(key: string): void {
    const cached = this.cache.get(key)
    if (cached) {
      cached.lastUsed = Date.now()
      logger.debug('Surface released', { key })
    }
  }

  /**
   * Remove a surface from cache
   */
  removeSurface(key: string): void {
    const cached = this.cache.get(key)
    if (cached) {
      cached.surface.dispose()
      this.cache.delete(key)
      logger.debug('Surface removed from cache', { key })
    }
  }

  /**
   * Clear all cached surfaces
   */
  clear(): void {
    for (const [key, cached] of this.cache.entries()) {
      cached.surface.dispose()
      this.cache.delete(key)
    }
    logger.debug('Surface cache cleared')
  }

  /**
   * Clean up old/unused surfaces
   */
  private cleanupIfNeeded(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return
    }

    // Remove oldest unused surfaces
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed)

    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize)
    for (const [key] of toRemove) {
      this.removeSurface(key)
    }

    logger.debug('Cleaned up old surfaces', {
      removed: toRemove.length,
      remaining: this.cache.size,
    })
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval !== null) {
      return
    }

    // Clean up every 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSurfaces()
    }, 10000)
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Clean up surfaces older than maxAgeMs
   */
  private cleanupOldSurfaces(): void {
    const now = Date.now()
    const keysToRemove: string[] = []

    for (const [key, cached] of this.cache.entries()) {
      const age = now - cached.lastUsed
      if (age > this.maxAgeMs) {
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      this.removeSurface(key)
    }

    if (keysToRemove.length > 0) {
      logger.debug('Cleaned up old surfaces by age', {
        removed: keysToRemove.length,
        remaining: this.cache.size,
      })
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    entries: Array<{ key: string; width: number; height: number; useCount: number; age: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      width: cached.width,
      height: cached.height,
      useCount: cached.useCount,
      age: now - cached.lastUsed,
    }))

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries,
    }
  }
}

// Singleton instance
let surfaceCacheInstance: SurfaceCache | null = null

/**
 * Get the singleton SurfaceCache instance
 */
export function getSurfaceCache(): SurfaceCache {
  if (!surfaceCacheInstance) {
    surfaceCacheInstance = new SurfaceCache()
  }
  return surfaceCacheInstance
}

/**
 * Hook to use SurfaceCache in React components
 */
export function useSurfaceCache(): SurfaceCache {
  return getSurfaceCache()
}
