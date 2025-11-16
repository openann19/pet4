/**
 * Liquid Dots Typing Indicator — Web
 * - Reanimated-driven sine chain (UI thread)
 * - Deterministic phases via seeded RNG
 * - Reduced motion: instant subtle pulse (≤120ms)
 * - Premium glow + slight blur (web-only)
 */

import React, { useMemo } from 'react'
import { motion } from '@petspark/motion'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

interface DotConfig {
  readonly phase: number
  readonly amplitude: number
}

export interface LiquidDotsProps {
  readonly enabled?: boolean
  readonly dotSize?: number
  readonly dotColor?: string
  readonly className?: string
  readonly dots?: number
  readonly seed?: number | string
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = 'hsl(var(--muted-foreground))',
  className,
  dots = 3,
  seed = 'liquid-dots'
}: LiquidDotsProps) {
  const reduced = useReducedMotion()
  const duration = getReducedMotionDuration(1200, reduced) / 1000 // Convert to seconds

  const dotConfigs = useMemo<DotConfig[]>(() => {
    const rng = createSeededRNG(seed)
    return Array.from({ length: dots }, () => ({
      phase: rng.range(0, Math.PI * 2),
      amplitude: rng.range(3, 7)
    }))
  }, [dots, seed])

  const dotStyle: React.CSSProperties = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: dotColor,
    filter: 'blur(0.4px)',
    boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`,
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1 ${className ?? ''}`}
      style={{ flexDirection: 'row' }}
    >
      {dotConfigs.map((dot, index) => {
        const yKeyframes = reduced ? [0] : [
          -dot.amplitude,
          dot.amplitude,
          -dot.amplitude
        ]

        const opacityKeyframes = reduced ? [1] : [
          0.6,
          1,
          0.6
        ]

        return (
          <motion.div
            key={`${dot.phase}-${index}`}
            style={dotStyle}
            animate={{
              y: yKeyframes,
              opacity: opacityKeyframes,
            }}
            transition={{
              duration,
              ease: 'easeInOut',
              repeat: enabled ? Infinity : 0,
              delay: (dot.phase + index * 0.2) * duration / (2 * Math.PI),
            }}
          />
        );
      })}
    </div>
  );
}
