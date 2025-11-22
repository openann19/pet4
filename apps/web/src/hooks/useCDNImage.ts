/**
 * Hook for CDN-optimized images
 */

import { useState, useEffect } from 'react'
import { generateCDNImageUrl, generateImageSrcSet, isCDNAvailable } from '@/lib/cdn-config'
import { supportsWebP, supportsAVIF } from '@/lib/image-loader'

export interface UseCDNImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'avif' | 'webp' | 'jpeg' | 'png' | 'auto'
  responsive?: boolean
}

export function useCDNImage(
  src: string,
  options: UseCDNImageOptions = {}
): {
  src: string
  srcSet?: string
  isLoading: boolean
  error: Error | null
} {
  const [optimizedSrc, setOptimizedSrc] = useState(src)
  const [srcSet, setSrcSet] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [bestFormat, setBestFormat] = useState<'avif' | 'webp' | 'jpeg' | 'png'>('jpeg')

  useEffect(() => {
    if (!isCDNAvailable()) {
      setOptimizedSrc(src)
      setIsLoading(false)
      return
    }

    // Detect best format
    if (options.format === 'auto' || !options.format) {
      supportsAVIF()
        .then((avifSupported) => {
          if (avifSupported) {
            setBestFormat('avif')
          } else if (supportsWebP()) {
            setBestFormat('webp')
          } else {
            setBestFormat('jpeg')
          }
        })
        .catch(() => setBestFormat('jpeg'))
    } else {
      setBestFormat(options.format)
    }
  }, [options.format])

  useEffect(() => {
    if (!isCDNAvailable()) {
      return
    }

    try {
      const cdnSrc = generateCDNImageUrl(src, {
        width: options.width,
        height: options.height,
        quality: options.quality,
        format: bestFormat
      })
      setOptimizedSrc(cdnSrc)

      if (options.responsive) {
        const srcSetValue = generateImageSrcSet(src, {
          format: bestFormat,
          quality: options.quality
        })
        setSrcSet(srcSetValue)
      }

      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setOptimizedSrc(src) // Fallback to original
      setIsLoading(false)
    }
  }, [src, options, bestFormat])

  return {
    src: optimizedSrc,
    srcSet,
    isLoading,
    error
  }
}

