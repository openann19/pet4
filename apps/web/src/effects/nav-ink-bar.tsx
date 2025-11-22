'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/utils/reduced-motion'

export interface NavInkBarProps {
  readonly containerRef: React.RefObject<HTMLElement>
  readonly activeIndex: number
  readonly durationMs?: number
  readonly easing?: string
  readonly height?: number
  readonly offsetY?: number
  readonly className?: string
}

interface InkMetrics {
  readonly width: number
  readonly translateX: number
}

const DEFAULT_METRICS: InkMetrics = { width: 0, translateX: 0 }

function measureInk(container: HTMLElement, index: number): InkMetrics {
  if (index < 0 || index >= container.children.length) {
    return DEFAULT_METRICS
  }

  const target = container.children[index] as HTMLElement | undefined

  if (!target) {
    return DEFAULT_METRICS
  }

  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  const width = targetRect.width
  const translateX = targetRect.left - containerRect.left + container.scrollLeft

  if (!Number.isFinite(width) || !Number.isFinite(translateX)) {
    return DEFAULT_METRICS
  }

  return {
    width,
    translateX,
  }
}

export default function NavInkBar({
  containerRef,
  activeIndex,
  durationMs = 280,
  easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
  height = 3,
  offsetY = 0,
  className,
}: NavInkBarProps): React.ReactElement | null {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [metrics, setMetrics] = useState<InkMetrics>(DEFAULT_METRICS)
  const frameRef = useRef<number | null>(null)

  const updateInk = useMemo(() => {
    return () => {
      if (!containerRef.current) {
        return
      }

      const measurement = measureInk(containerRef.current, activeIndex)

      setMetrics((current) => {
        if (
          Math.abs(current.width - measurement.width) < 0.5 &&
          Math.abs(current.translateX - measurement.translateX) < 0.5
        ) {
          return current
        }

        return measurement
      })
    }
  }, [activeIndex, containerRef])

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return
    }

    updateInk()
  }, [updateInk, containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const handleResize = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      frameRef.current = requestAnimationFrame(() => {
        updateInk()
        frameRef.current = null
      })
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    Array.from(container.children).forEach((child) => {
      resizeObserver.observe(child)
    })

    container.addEventListener('scroll', handleResize, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('scroll', handleResize)
      window.removeEventListener('resize', handleResize)

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [containerRef, updateInk])

  const transitionValue = prefersReducedMotion
    ? 'none'
    : `transform ${String(durationMs ?? '')}ms ${String(easing ?? '')}, width ${String(durationMs ?? '')}ms ${String(easing ?? '')}`

  const style = useMemo<React.CSSProperties>(() => {
    return {
      width: `${String(Math.max(0, metrics.width) ?? '')}px`,
      transform: `translate3d(${String(metrics.translateX ?? '')}px, ${String(offsetY ?? '')}px, 0)`
        .replace('translate3d(NaNpx, NaNpx, 0)', 'translate3d(0px, 0px, 0)'),
      transition: transitionValue,
      height,
    }
  }, [metrics.width, metrics.translateX, offsetY, transitionValue, height])

  const shouldRender = metrics.width > 0

  if (!shouldRender) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(
        'pointer-events-none absolute bottom-0 left-0 rounded-full bg-linear-to-r from-primary via-accent to-secondary shadow-lg shadow-primary/25',
        className
      )}
      style={style}
    />
  )
}
