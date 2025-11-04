/**
 * Utility for checking prefers-reduced-motion preference
 */

import { useState, useEffect } from 'react'

let prefersReducedMotion: boolean | null = null

export function getPrefersReducedMotion(): boolean {
  if (prefersReducedMotion === null && typeof window !== 'undefined') {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return prefersReducedMotion ?? false
}

export function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const [prefersReduced, setPrefersReduced] = useState(mediaQuery.matches)

  useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mediaQuery])

  return prefersReduced
}

