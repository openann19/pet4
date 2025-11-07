'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/utils/reduced-motion'
import { useFeatureFlags } from '@/config/feature-flags'
import { isTruthy, isDefined } from '@/core/guards';

export interface HoloBackgroundProps {
  intensity?: number
  className?: string
}

/**
 * HoloBackground Component
 * 
 * Subtle animated radial gradient background that "breathes"
 * Respects reduced motion preferences
 */
export default function HoloBackground({ 
  intensity = 0.6,
  className = ''
}: HoloBackgroundProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { enableHoloBackground } = useFeatureFlags()
  
  useEffect(() => {
    if (!enableHoloBackground || reducedMotion) {
      // Static background when disabled or reduced motion
      const c = ref.current
      if (isTruthy(c)) {
        const g = c.getContext('2d', { alpha: false })
        if (isTruthy(g)) {
          const w = (c.width = c.offsetWidth * devicePixelRatio)
          const h = (c.height = c.offsetHeight * devicePixelRatio)
          const cx = w / 2
          const cy = h / 2
          const r = Math.max(w, h)
          const grad = g.createRadialGradient(cx, cy, r * 0.05, cx, cy, r * 0.8)
          grad.addColorStop(0, `rgba(160,180,255,${String(0.35 * intensity ?? '')})`)
          grad.addColorStop(0.5, `rgba(120,80,255,${String(0.25 * intensity ?? '')})`)
          grad.addColorStop(1, `rgba(20,20,40,1)`)
          g.fillStyle = grad
          g.fillRect(0, 0, w, h)
        }
      }
      return
    }
    
    const c = ref.current!
    const g = c.getContext('2d', { alpha: false })!
    let w = (c.width = c.offsetWidth * devicePixelRatio)
    let h = (c.height = c.offsetHeight * devicePixelRatio)
    let t = 0
    let raf = 0
    
    const R = () => {
      if (w !== c.offsetWidth * devicePixelRatio || h !== c.offsetHeight * devicePixelRatio) {
        w = c.width = c.offsetWidth * devicePixelRatio
        h = c.height = c.offsetHeight * devicePixelRatio
      }
      
      t += 0.003
      const cx = w / 2
      const cy = h / 2
      const r = Math.max(w, h)
      const grad = g.createRadialGradient(
        cx + Math.sin(t * 1.3) * r * 0.1,
        cy + Math.cos(t * 1.7) * r * 0.1,
        r * 0.05,
        cx,
        cy,
        r * 0.8
      )
      grad.addColorStop(0, `rgba(160,180,255,${String(0.35 * intensity ?? '')})`)
      grad.addColorStop(0.5, `rgba(120,80,255,${String(0.25 * intensity ?? '')})`)
      grad.addColorStop(1, `rgba(20,20,40,1)`)
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
      raf = requestAnimationFrame(R)
    }
    
    raf = requestAnimationFrame(R)
    
    return () => { cancelAnimationFrame(raf); }
  }, [intensity, reducedMotion, enableHoloBackground])
  
  return (
    <canvas 
      ref={ref} 
      className={`absolute inset-0 -z-10 ${String(className ?? '')}`}
      aria-hidden="true"
    />
  )
}
