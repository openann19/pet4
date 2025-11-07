/**
 * Viewport Preload Hook
 * 
 * Lazy-loads images and videos when they enter the viewport.
 * Uses IntersectionObserver for efficient viewport detection.
 * 
 * Location: apps/web/src/hooks/useViewportPreload.ts
 */

import { useEffect } from 'react'

/**
 * Options for viewport preloading
 */
export interface UseViewportPreloadOptions {
  /**
   * CSS selector for elements to preload
   * @default '[data-preload-src]'
   */
  selector?: string
  
  /**
   * Root margin for IntersectionObserver (e.g., '200px' to preload early)
   * @default '200px'
   */
  rootMargin?: string
}

/**
 * Hook to preload images/videos when they enter the viewport
 * 
 * Elements should have `data-preload-src` attribute instead of `src`.
 * When element enters viewport, the src is set and preload-src is removed.
 * 
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * // In component
 * useViewportPreload()
 * 
 * // In JSX
 * <img data-preload-src="/image.jpg" alt="..." />
 * ```
 */
export function useViewportPreload(options: UseViewportPreloadOptions = {}): void {
  const { selector = '[data-preload-src]', rootMargin = '200px' } = options

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          const el = entry.target as HTMLElement
          const src = el.getAttribute('data-preload-src')
          
          if (!src) continue

          // Set src based on element type
          if (el.tagName === 'IMG') {
            const imgEl = el as HTMLImageElement
            imgEl.src = src
          } else if (el.tagName === 'VIDEO') {
            const videoEl = el as HTMLVideoElement
            videoEl.src = src
          }

          // Remove preload attribute and stop observing
          el.removeAttribute('data-preload-src')
          io.unobserve(el)
        }
      },
      { rootMargin }
    )

    // Observe all matching elements
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => { io.observe(el); })

    // Cleanup
    return () => {
      io.disconnect()
    }
  }, [selector, rootMargin])
}

