'use client'

import { useEffect, useRef } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseInfiniteScrollOptions {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  enabled?: boolean
}

export interface UseInfiniteScrollReturn {
  observerTarget: React.RefObject<HTMLDivElement>
}

export function useInfiniteScroll(
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn {
  const { hasMore, loading, onLoadMore, enabled = true } = options
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current
    if (isTruthy(target)) {
      observer.observe(target)
    }

    return () => {
      if (isTruthy(target)) {
        observer.unobserve(target)
      }
      observer.disconnect()
    }
  }, [hasMore, loading, onLoadMore, enabled])

  return {
    observerTarget
  }
}

