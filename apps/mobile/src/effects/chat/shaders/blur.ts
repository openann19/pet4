/**
 * Blur Shader for Chat Effects
 * 
 * GPU-accelerated Gaussian blur with configurable radius (8-16px).
 * Uses offscreen surface caching for performance.
 * 
 * Location: apps/mobile/src/effects/chat/shaders/blur.ts
 */

import { Skia, type SkImageFilter } from '@shopify/react-native-skia'
import { createLogger } from '../../../utils/logger'
import { getSurfaceCache } from '../core/surface-cache'

const logger = createLogger('blur-shader')

/**
 * Blur configuration
 */
export interface BlurConfig {
  radius: number // blur radius in pixels (8-16px per spec)
  sigma?: number // sigma value for Gaussian blur (auto-calculated if not provided)
}

/**
 * Calculate sigma from radius for Gaussian blur
 * Sigma ≈ radius / 2.5 for optimal Gaussian blur
 */
function calculateSigma(radius: number): number {
  return radius / 2.5
}

/**
 * Create a blur image filter
 * 
 * Uses Skia's ImageFilter.blur() for GPU-accelerated blur
 * 
 * @param config - Blur configuration
 * @returns Blur image filter
 */
export function createBlurFilter(config: BlurConfig): SkImageFilter {
  const { radius, sigma } = config

  // Validate radius (per spec: 8-16px)
  const clampedRadius = Math.max(8, Math.min(16, radius))
  const finalSigma = sigma ?? calculateSigma(clampedRadius)

  if (clampedRadius !== radius) {
    logger.warn('Blur radius clamped to 8-16px range', { requested: radius, clamped: clampedRadius })
  }

  // Create Skia blur filter
  // Note: Skia.ImageFilter.MakeBlur uses TileMode enum from Skia namespace
  // Using 0 for Clamp mode (TileMode.Clamp = 0)
  const blurFilter = Skia.ImageFilter.MakeBlur(finalSigma, finalSigma, 0, null)

  if (!blurFilter) {
    throw new Error(`Failed to create blur filter: radius=${String(clampedRadius ?? '')}, sigma=${String(finalSigma ?? '')}`)
  }

  logger.debug('Blur filter created', { radius: clampedRadius, sigma: finalSigma })

  return blurFilter
}

/**
 * Get cached blur filter
 * Reuses filters with the same radius for better performance
 */
const blurFilterCache = new Map<number, SkImageFilter>()

export function getCachedBlurFilter(config: BlurConfig): SkImageFilter {
  const { radius } = config
  const clampedRadius = Math.max(8, Math.min(16, radius))

  let filter = blurFilterCache.get(clampedRadius)

  if (!filter) {
    filter = createBlurFilter({ radius: clampedRadius })
    blurFilterCache.set(clampedRadius, filter)
    logger.debug('Blur filter cached', { radius: clampedRadius })
  }

  return filter
}

/**
 * Clear blur filter cache
 */
export function clearBlurFilterCache(): void {
  blurFilterCache.clear()
  logger.debug('Blur filter cache cleared')
}

/**
 * Apply blur effect using offscreen surface
 * 
 * Uses surface cache to reuse offscreen surfaces for better performance
 */
export function applyBlurWithSurface(
  sourceWidth: number,
  sourceHeight: number,
  blurRadius: number
): {
  filter: SkImageFilter
  surfaceKey: string
} {
  const surfaceCache = getSurfaceCache()
  const clampedRadius = Math.max(8, Math.min(16, blurRadius))
  
  // Create a cache key for this blur configuration
  const surfaceKey = `blur-${String(clampedRadius ?? '')}-${String(sourceWidth ?? '')}x${String(sourceHeight ?? '')}`

  // Get or create cached surface (for future use in rendering pipeline)
  surfaceCache.getSurface(surfaceKey, sourceWidth, sourceHeight)

  // Get blur filter
  const filter = getCachedBlurFilter({ radius: clampedRadius })

  logger.debug('Blur applied with surface cache', {
    radius: clampedRadius,
    surfaceKey,
    width: sourceWidth,
    height: sourceHeight,
  })

  return {
    filter,
    surfaceKey,
  }
}

/**
 * Release blur surface
 */
export function releaseBlurSurface(surfaceKey: string): void {
  const surfaceCache = getSurfaceCache()
  surfaceCache.releaseSurface(surfaceKey)
}

