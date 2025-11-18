/**
 * CDN Configuration
 * 
 * Centralized configuration for CDN asset delivery and optimization
 */

import { createLogger } from './logger'

const logger = createLogger('CDNConfig')

export interface CDNConfig {
  baseUrl: string
  imageOptimization: {
    formats: ('avif' | 'webp' | 'jpeg' | 'png')[]
    quality: number[]
    sizes: number[]
    defaultQuality: number
  }
  videoOptimization: {
    formats: ('mp4' | 'webm')[]
    quality: number[]
  }
  enableCache: boolean
  cacheVersion: string
}

export const CDN_CONFIG: CDNConfig = {
  baseUrl: (import.meta.env.VITE_CDN_URL as string | undefined) ?? 'https://cdn.petspark.com',
  imageOptimization: {
    formats: ['avif', 'webp', 'jpeg'],
    quality: [75, 85, 95],
    sizes: [400, 800, 1200, 1600, 2400],
    defaultQuality: 85
  },
  videoOptimization: {
    formats: ['mp4', 'webm'],
    quality: [480, 720, 1080]
  },
  enableCache: true,
  cacheVersion: 'v1'
}

/**
 * Generate optimized CDN URL for images
 */
export function generateCDNImageUrl(
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'avif' | 'webp' | 'jpeg' | 'png' | 'auto'
  } = {}
): string {
  try {
    const url = new URL(path, CDN_CONFIG.baseUrl)
    const params = new URLSearchParams()

    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    params.set('q', (options.quality ?? CDN_CONFIG.imageOptimization.defaultQuality).toString())
    
    if (options.format && options.format !== 'auto') {
      params.set('fm', options.format)
    }

    params.set('v', CDN_CONFIG.cacheVersion)

    return `${url.pathname}?${params.toString()}`
  } catch (_error) {
    const normalized = _error instanceof Error ? _error : new Error(String(_error));
    logger.warn('Failed to generate CDN URL, using original', { path, _error: normalized.message });
    return path
  }
}

/**
 * Generate srcSet for responsive images
 */
export function generateImageSrcSet(
  basePath: string,
  options: {
    format?: 'avif' | 'webp' | 'jpeg' | 'png' | 'auto'
    quality?: number
  } = {}
): string {
  const { sizes } = CDN_CONFIG.imageOptimization
  const srcSet = sizes
    .map(size => {
      const url = generateCDNImageUrl(basePath, {
        width: size,
        quality: options.quality,
        format: options.format
      })
      return `${url} ${size}w`
    })
    .join(', ')

  return srcSet
}

/**
 * Prefetch critical assets
 */
export function prefetchCriticalAssets(assets: string[]): void {
  if (typeof document === 'undefined') return

  assets.forEach(asset => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = asset.startsWith('http') ? asset : `${CDN_CONFIG.baseUrl}${asset}`
    link.as = (/\.(jpg|jpeg|png|webp|avif)$/i.exec(asset)) ? 'image' : 'fetch'
    document.head.appendChild(link)
  })

  logger.debug('Prefetched critical assets', { count: assets.length })
}

/**
 * Check if CDN is available
 */
export function isCDNAvailable(): boolean {
  return !!CDN_CONFIG.baseUrl && CDN_CONFIG.baseUrl !== 'https://cdn.petspark.com' || 
         import.meta.env.VITE_CDN_URL !== undefined
}

