'use client'

import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { cn } from '@/lib/utils'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface SpinnerProps extends ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'premium'
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
} as const

function Spinner({ 
  className, 
  size = 'md', 
  variant = 'default',
  ...props 
}: SpinnerProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const rotation = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (reducedMotion) {
      // For reduced motion, use a slower, less noticeable animation
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
      opacity.value = withRepeat(
        withTiming(0.7, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    } else {
      // Premium smooth animation for normal users
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
      opacity.value = 1
    }
  }, [reducedMotion, rotation, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      opacity: opacity.value,
    }
  }) as AnimatedStyle

  const variantClasses = {
    default: 'border-primary border-t-transparent',
    subtle: 'border-primary/60 border-t-transparent/40',
    premium: 'border-primary border-t-transparent shadow-lg shadow-primary/20',
  } as const

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn('inline-block', className)}
      {...props}
    >
      <AnimatedView
        style={animatedStyle}
        className={cn(
          'rounded-full',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export { Spinner }
