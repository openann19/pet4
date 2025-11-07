import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { supportsWebP, supportsAVIF } from '@/lib/image-loader'
import { isTruthy, isDefined } from '@/core/guards';

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  quality = 85,
  format = 'auto',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [optimizedSrc, setOptimizedSrc] = useState(src)
  const imgRef = useRef<HTMLImageElement>(null)

  const getOptimizedSrc = (originalSrc: string, imgFormat: 'webp' | 'avif' | 'original'): string => {
    if (imgFormat === 'original') return originalSrc
    
    try {
      const url = new URL(originalSrc, window.location.origin)
      const params = new URLSearchParams(url.search)
      
      if (isTruthy(width)) params.set('w', width.toString())
      if (isTruthy(height)) params.set('h', height.toString())
      if (isTruthy(quality)) params.set('q', quality.toString())
      params.set('fm', imgFormat)
      
      return `${String(url.pathname ?? '')}?${String(params.toString() ?? '')}`
    } catch {
      return originalSrc
    }
  }

  // Detect and set best format
  useEffect(() => {
    if (format === 'auto') {
      supportsAVIF().then((avifSupported) => {
        if (isTruthy(avifSupported)) {
          setOptimizedSrc(getOptimizedSrc(src, 'avif'))
        } else if (supportsWebP()) {
          setOptimizedSrc(getOptimizedSrc(src, 'webp'))
        } else {
          setOptimizedSrc(src)
        }
      })
    } else {
      setOptimizedSrc(getOptimizedSrc(src, format))
    }
  }, [src, format, width, height, quality])

  useEffect(() => {
    if (!imgRef.current) return

    if (isTruthy(imgRef.current.complete)) {
      setIsLoaded(true)
      onLoad?.()
    }
  }, [onLoad])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    // Fallback to original if optimized fails
    if (optimizedSrc !== src) {
      setOptimizedSrc(src)
      // Try again with original
      setTimeout(() => {
        if (isTruthy(imgRef.current)) {
          imgRef.current.src = src
        }
      }, 0)
    } else {
      setHasError(true)
      onError?.()
    }
  }

  if (isTruthy(hasError)) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Image not available</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  )
}
