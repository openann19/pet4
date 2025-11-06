'use client'

import { useCallback } from 'react'
import { useRippleEffect } from '@/effects/reanimated/use-ripple-effect'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { cn } from '@/lib/utils'
import type { ReactNode, HTMLAttributes } from 'react'

export interface RippleEffectProps extends HTMLAttributes<HTMLDivElement> {
  color?: string
  opacity?: number
  duration?: number
  disabled?: boolean
  children?: ReactNode
}

export function RippleEffect({
  color = 'rgba(255, 255, 255, 0.5)',
  opacity = 0.5,
  duration = 600,
  disabled = false,
  children,
  className,
  onClick,
  ...props
}: RippleEffectProps) {
  const ripple = useRippleEffect({ color, opacity, duration })

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      ripple.addRipple(e)
      onClick?.(e)
    }
  }, [disabled, ripple, onClick])

  return (
    <div
      onClick={handleClick}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {children}
      {ripple.ripples.map((rippleState) => (
        <AnimatedView
          key={rippleState.id}
          style={{
            ...ripple.animatedStyle,
            position: 'absolute',
            left: rippleState.x,
            top: rippleState.y,
            width: 20,
            height: 20,
            backgroundColor: ripple.color,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%'
          }}
        />
      ))}
    </div>
  )
}

