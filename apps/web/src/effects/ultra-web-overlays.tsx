/**
 * Ultra Web Overlays
 * Drop-in, framework-agnostic web effects for your App.tsx tree.
 * 
 * Features:
 * - Zero external dependencies
 * - Tailwind-friendly
 * - Respects prefers-reduced-motion
 * - TypeScript strict mode
 * - 60fps performance optimized
 * 
 * Components:
 *  - <AmbientAuroraBackground /> : premium moving gradient backdrop
 *  - <ScrollProgressBar />       : top progress bar bound to page scroll
 *  - <PageChangeFlash />         : radial flash when the view changes
 *
 * Usage (minimal):
 * 1) Import into App.tsx:
 *    import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'
 * 
 * 2) Inside the main-screen container (where you already render <HoloBackground/>):
 *    <AmbientAuroraBackground intensity={0.35} />
 *    <PageChangeFlash key={currentView} />
 *    <ScrollProgressBar />
 * 
 * 3) That's it. You can tune colors via props.
 * 
 * Location: apps/web/src/effects/ultra-web-overlays.tsx
 */

import React, { useEffect, useMemo, useState } from 'react'

// ============================================================
// UTILITIES
// ============================================================

/**
 * Hook to detect user's motion preference
 * Respects system-level accessibility settings
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setReduced(Boolean(mediaQuery.matches))
    }

    updatePreference()
    mediaQuery.addEventListener?.('change', updatePreference)

    return () => {
      mediaQuery.removeEventListener?.('change', updatePreference)
    }
  }, [])

  return reduced
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// ============================================================
// AMBIENT AURORA BACKGROUND
// ============================================================

export interface AmbientAuroraBackgroundProps {
  /** Intensity of the effect (0-1) */
  intensity?: number
  /** Blur amount in pixels */
  blur?: number
  /** Hue rotation per layer in degrees */
  hueRotate?: number
  /** Number of gradient layers (1-6) */
  layers?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Premium moving gradient backdrop with layered auroras
 * Battery-safe, respects reduced motion, subtle and elegant
 * 
 * @example
 * ```tsx
 * <AmbientAuroraBackground intensity={0.35} />
 * ```
 */
export function AmbientAuroraBackground({
  intensity = 0.4,
  blur = 60,
  hueRotate = 22,
  layers = 4,
  className = '',
}: AmbientAuroraBackgroundProps): React.JSX.Element {
  const reduceMotion = usePrefersReducedMotion()
  const layerCount = clamp(layers, 1, 6)
  const layerArray = useMemo(
    () => Array.from({ length: layerCount }, (_: unknown, i: number) => i),
    [layerCount]
  )

  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 ${String(className ?? '')}`}
      aria-hidden="true"
    >
      {layerArray.map((i: number) => (
        <div
          key={i}
          className="absolute inset-[-20%] rounded-[48px]"
          style={{
            filter: `blur(${String(blur + i * 8)}px) hue-rotate(${String(i * hueRotate)}deg)`,
            opacity: intensity * (0.18 + i * 0.06),
            mixBlendMode: 'screen',
            background:
              'radial-gradient(40% 60% at 20% 30%, rgba(14,165,233,0.7), transparent 60%), ' +
              'radial-gradient(35% 55% at 80% 20%, rgba(34,211,238,0.7), transparent 60%), ' +
              'radial-gradient(30% 50% at 30% 80%, rgba(167,139,250,0.65), transparent 60%), ' +
              'radial-gradient(28% 48% at 75% 75%, rgba(244,114,182,0.6), transparent 60%)',
            animation: reduceMotion
              ? undefined
                : `aurora-rotate ${String(28 + i * 6)}s linear infinite`,
            transform: 'scale(1.2)',
          }}
        />
      ))}
      <style>{`
        @keyframes aurora-rotate {
          from { transform: rotate(0deg) scale(1.2); }
          to   { transform: rotate(360deg) scale(1.2); }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// SCROLL PROGRESS BAR
// ============================================================

export interface ScrollProgressBarProps {
  /** Height of the progress bar in pixels */
  height?: number
  /** Color of the progress bar (CSS color value) */
  color?: string
}

/**
 * Slim top bar that tracks page scroll position
 * Shows visual feedback for scroll progress
 * 
 * @example
 * ```tsx
 * <ScrollProgressBar height={2} color="var(--primary, #3B82F6)" />
 * ```
 */
export function ScrollProgressBar({
  height = 2,
  color = 'var(--primary, #3B82F6)',
}: ScrollProgressBarProps): React.JSX.Element {
  const [progress, setProgress] = useState(0)
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
      )
      const viewportHeight = window.innerHeight
      const maxScroll = Math.max(1, documentHeight - viewportHeight)
      const scrollProgress = clamp((scrollTop / maxScroll) * 100, 0, 100)

      setProgress(scrollProgress)
    }

    // Initial calculation
    updateProgress()

    // Listen to scroll and resize events
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] pointer-events-none">
      <div
        style={{
          height,
          width: `${String(progress ?? '')}%`,
          background: `linear-gradient(90deg, ${String(color ?? '')}, rgba(59,130,246,0.4))`,
          transition: reduceMotion ? 'width 50ms linear' : 'width 120ms ease-out',
          boxShadow: '0 0 12px rgba(59,130,246,0.35)',
        }}
      />
    </div>
  )
}

// ============================================================
// PAGE CHANGE FLASH
// ============================================================

export interface PageChangeFlashProps {
  /** Animation duration in milliseconds */
  duration?: number
  /** Flash color (CSS color value) */
  color?: string
}

/**
 * Quick radial flash when view/page changes
 * Provides visual feedback for navigation transitions
 * 
 * Use with React key prop to trigger on view change:
 * ```tsx
 * <PageChangeFlash key={currentView} />
 * ```
 * 
 * @example
 * ```tsx
 * <PageChangeFlash duration={520} color="rgba(255,255,255,0.9)" />
 * ```
 */
export function PageChangeFlash({
  duration = 520,
  color = 'rgba(255,255,255,0.9)',
}: PageChangeFlashProps): React.JSX.Element | null {
  const [show, setShow] = useState(true)
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, duration)

    return () => {
      clearTimeout(timer)
    }
  }, [duration])

  if (!show) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center">
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${String(color ?? '')} 0%, transparent 70%)`,
          transform: 'translateZ(0) scale(0.8)',
          animation: reduceMotion
            ? undefined
            : `flash-scale ${String(duration ?? '')}ms ease-out forwards`,
          opacity: reduceMotion ? 0.12 : 1,
        }}
      />
      <style>{`
        @keyframes flash-scale {
          0%   { transform: scale(0.8); opacity: 0.85; }
          60%  { transform: scale(2.2); opacity: 0.25; }
          100% { transform: scale(3.0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// DEFAULT EXPORT (for convenience)
// ============================================================

export default {
  AmbientAuroraBackground,
  ScrollProgressBar,
  PageChangeFlash,
}
