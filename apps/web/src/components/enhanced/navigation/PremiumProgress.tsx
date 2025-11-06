'use client'

import { useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs } from '@/effects/reanimated/transitions'
import { cn } from '@/lib/utils'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface PremiumProgressProps {
  value?: number
  max?: number
  variant?: 'default' | 'gradient' | 'striped'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
  animated?: boolean
  className?: string
  'aria-label': string
}

export function PremiumProgress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  label,
  animated = true,
  className,
  'aria-label': ariaLabel,
}: PremiumProgressProps): React.JSX.Element {
  const progressWidth = useSharedValue(0)
  const shimmerX = useSharedValue(-100)

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  useEffect(() => {
    if (animated) {
      progressWidth.value = withSpring(percentage, springConfigs.smooth)
    } else {
      progressWidth.value = withTiming(percentage, { duration: 300 })
    }
  }, [percentage, animated, progressWidth])

  useEffect(() => {
    if (variant === 'striped') {
      shimmerX.value = withTiming(200, { duration: 2000, repeat: Infinity })
    }
  }, [variant, shimmerX])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  })) as AnimatedStyle

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  })) as AnimatedStyle

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variants = {
    default: 'bg-primary',
    gradient: 'bg-linear-to-r from-primary via-primary/80 to-primary',
    striped: 'bg-primary',
  }

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="text-sm font-medium text-foreground">{label}</label>
          )}
          {showValue && (
            <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <ProgressPrimitive.Root
        value={value}
        max={max}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-muted',
          sizes[size]
        )}
        aria-label={ariaLabel}
      >
        <AnimatedView
          style={progressStyle}
          className={cn(
            'h-full rounded-full transition-all duration-300',
            variants[variant],
            variant === 'striped' && 'relative overflow-hidden'
          )}
        >
          {variant === 'striped' && (
            <AnimatedView
              style={shimmerStyle}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            >
              <div />
            </AnimatedView>
          )}
          <div />
        </AnimatedView>
      </ProgressPrimitive.Root>
    </div>
  )
}
