import { LRUCache } from './optimization-core'
import { isTruthy, isDefined } from '@/core/guards';

interface ImageLoadOptions {
  crossOrigin?: 'anonymous' | 'use-credentials'
  priority?: 'high' | 'low' | 'auto'
  loading?: 'lazy' | 'eager'
  decoding?: 'sync' | 'async' | 'auto'
}

class ImageLoader {
  private cache: LRUCache<string, HTMLImageElement>
  private pendingLoads: Map<string, Promise<HTMLImageElement>>

  constructor(cacheSize: number = 100) {
    this.cache = new LRUCache(cacheSize)
    this.pendingLoads = new Map()
  }

  preload(src: string, options: ImageLoadOptions = {}): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!)
    }

    if (this.pendingLoads.has(src)) {
      return this.pendingLoads.get(src)!
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()

      if (isTruthy(options.crossOrigin)) {
        img.crossOrigin = options.crossOrigin
      }

      if (isTruthy(options.decoding)) {
        img.decoding = options.decoding
      }

      img.onload = () => {
        this.cache.set(src, img)
        this.pendingLoads.delete(src)
        resolve(img)
      }

      img.onerror = () => {
        this.pendingLoads.delete(src)
        reject(new Error(`Failed to load image: ${String(src ?? '')}`))
      }

      img.src = src
    })

    this.pendingLoads.set(src, promise)
    return promise
  }

  preloadBatch(sources: string[], options: ImageLoadOptions = {}): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map((src) => this.preload(src, options)))
  }

  lazyLoad(
    img: HTMLImageElement,
    src: string,
    options: {
      placeholder?: string
      rootMargin?: string
      threshold?: number
      onLoad?: () => void
      onError?: (error: Error) => void
    } = {}
  ): () => void {
    const {
      placeholder,
      rootMargin = '50px',
      threshold = 0.01,
      onLoad,
      onError,
    } = options

    if (isTruthy(placeholder)) {
      img.src = placeholder
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (isTruthy(entry.isIntersecting)) {
            this.preload(src)
              .then((loadedImg) => {
                img.src = loadedImg.src
                img.srcset = loadedImg.srcset
                onLoad?.()
              })
              .catch((error) => {
                onError?.(error)
              })
              .finally(() => {
                observer.disconnect()
              })
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(img)

    return () => {
      observer.disconnect()
    }
  }

  generateSrcSet(
    baseUrl: string,
    widths: number[],
    format?: string
  ): string {
    return widths
      .map((width) => {
        const url = format
          ? `${String(baseUrl ?? '')}?w=${String(width ?? '')}&fm=${String(format ?? '')}`
          : `${String(baseUrl ?? '')}?w=${String(width ?? '')}`
        return `${String(url ?? '')} ${String(width ?? '')}w`
      })
      .join(', ')
  }

  getOptimizedSrc(
    src: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'jpeg' | 'png'
    } = {}
  ): string {
    const url = new URL(src, window.location.origin)
    const params = new URLSearchParams()

    if (isTruthy(options.width)) params.set('w', options.width.toString())
    if (isTruthy(options.height)) params.set('h', options.height.toString())
    if (isTruthy(options.quality)) params.set('q', options.quality.toString())
    if (isTruthy(options.format)) params.set('fm', options.format)

    return `${String(url.pathname ?? '')}?${String(params.toString() ?? '')}`
  }

  prefetchImages(sources: string[]): void {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    sources.forEach((src) => {
      const prefetchLink = link.cloneNode() as HTMLLinkElement
      prefetchLink.href = src
      prefetchLink.as = 'image'
      document.head.appendChild(prefetchLink)
    })
  }

  clearCache(): void {
    this.cache.clear()
    this.pendingLoads.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }

  isPending(src: string): boolean {
    return this.pendingLoads.has(src)
  }

  isCached(src: string): boolean {
    return this.cache.has(src)
  }
}

export const imageLoader = new ImageLoader()

export function createPlaceholder(
  width: number,
  height: number,
  color: string = '#e5e7eb'
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL()
}

export function generateBlurDataURL(
  src: string,
  size: number = 10
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.filter = 'blur(2px)'
      ctx.drawImage(img, 0, 0, size, size)

      resolve(canvas.toDataURL())
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${String(src ?? '')}`))
    }

    img.src = src
  })
}

export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = () => { resolve(true); }
    avif.onerror = () => { resolve(false); }
    avif.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

export const imageFormats = {
  webp: supportsWebP(),
  avif: supportsAVIF(),
}
