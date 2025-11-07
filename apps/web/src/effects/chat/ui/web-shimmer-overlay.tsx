'use client'

import React from 'react'
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view'
import { useShimmerSweep } from '@/effects/reanimated/use-shimmer-sweep'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '../core/reduced-motion'

export interface WebShimmerOverlayProps {
  width: number
  height?: number
  streakWidth?: number
  duration?: number
  delay?: number
  opacityRange?: [number, number]
  paused?: boolean
  easing?: (value: number) => number
  className?: string
  children?: React.ReactNode
}

const DEFAULT_HEIGHT = 24
const DEFAULT_STREAK = 0.35

export function WebShimmerOverlay({
  width,
  height = DEFAULT_HEIGHT,
  streakWidth = DEFAULT_STREAK,
  duration,
  delay,
  opacityRange,
  paused,
  easing,
  className,
  children,
}: WebShimmerOverlayProps): React.ReactElement | null {
  if (width <= 0) {
    return null
  }

  const reducedMotion = useReducedMotion()
  const shimmer = useShimmerSweep({
    width,
    duration,
    delay,
    opacityRange,
    paused: paused ?? reducedMotion,
    easing,
  })

  const streakWidthPx = Math.max(width * streakWidth, 1)

  return (
    <AnimatedView
      className={cn('absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]', className)}
    >
      <AnimatedView
        style={{
          ...(shimmer.animatedStyle as AnimatedStyle),
          width: streakWidthPx,
          height,
        }}
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-md"
      >
        {children ?? <div className="h-full w-full bg-white/30" />}
      </AnimatedView>
    </AnimatedView>
  )
}

export default WebShimmerOverlay
