'use client'

import { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { timingConfigs } from '@/effects/reanimated/transitions'
import { cn } from '@/lib/utils'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import type { ReactNode } from 'react'

export interface ShimmerEffectProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  animated?: boolean
}

export function ShimmerEffect({
  width = '100%',
  height = '1rem',
  borderRadius = '0.5rem',
  className,
  animated = true
}: ShimmerEffectProps) {
  const shimmerPosition = useSharedValue(-100)

  if (animated) {
    shimmerPosition.value = withRepeat(
      withTiming(200, { duration: 1500 }),
      -1,
      false
    )
  }

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value }]
  })) as AnimatedStyle

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted rounded-lg',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      }}
    >
      <AnimatedView
        style={shimmerStyle}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2"
      />
    </div>
  )
}

