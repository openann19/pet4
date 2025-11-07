'use client'

import { useSharedValue, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { useEffect, useState, useCallback } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
  shimmer?: boolean
  glow?: boolean
  pulse?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

function useSharedValueStyle(sharedValue: ReturnType<typeof useSharedValue<number>>): number {
  const [value, setValue] = useState(sharedValue.value)

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(sharedValue.value)
    }, 16)
    return () => { clearInterval(interval); }
  }, [sharedValue])

  return value
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  shimmer = false,
  glow = false,
  pulse = false,
  type = 'button',
  ariaLabel
}: AnimatedButtonProps) {
  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)
  const shimmerX = useSharedValue(-200)
  const glowProgress = useSharedValue(0)
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(1)

  const currentScale = useSharedValueStyle(scale)
  const currentTranslateY = useSharedValueStyle(translateY)
  const currentShimmerX = useSharedValueStyle(shimmerX)
  const currentGlowProgress = useSharedValueStyle(glowProgress)
  const currentPulseScale = useSharedValueStyle(pulseScale)
  const currentPulseOpacity = useSharedValueStyle(pulseOpacity)

  const handlePress = useCallback(() => {
    if (isTruthy(disabled)) return
    haptics.impact('light')
    
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 400
    }, () => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400
      })
    })

    onClick?.()
  }, [disabled, onClick, scale])

  const handleEnter = useCallback(() => {
    if (isTruthy(disabled)) return
    scale.value = withSpring(1.05, { damping: 25, stiffness: 400 })
    translateY.value = withSpring(-2, { damping: 25, stiffness: 400 })
  }, [disabled, scale, translateY])

  const handleLeave = useCallback(() => {
    if (isTruthy(disabled)) return
    scale.value = withSpring(1, { damping: 25, stiffness: 400 })
    translateY.value = withSpring(0, { damping: 25, stiffness: 400 })
  }, [disabled, scale, translateY])

  useEffect(() => {
    if (shimmer && !disabled) {
      shimmerX.value = withRepeat(
        withTiming(200, {
          duration: 2000,
          easing: Easing.linear
        }),
        -1,
        false
      )
    } else {
      shimmerX.value = -200
    }
  }, [shimmer, disabled, shimmerX])

  useEffect(() => {
    if (glow && !disabled) {
      glowProgress.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      )
    } else {
      glowProgress.value = 0
    }
  }, [glow, disabled, glowProgress])

  useEffect(() => {
    if (pulse && !disabled) {
      pulseScale.value = withRepeat(
        withTiming(1.05, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      )
      pulseOpacity.value = withRepeat(
        withTiming(0.7, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      )
    } else {
      pulseScale.value = 1
      pulseOpacity.value = 1
    }
  }, [pulse, disabled, pulseScale, pulseOpacity])

  const containerStyle: CSSProperties = {
    transform: `scale(${String(currentScale * currentPulseScale ?? '')}) translateY(${String(currentTranslateY ?? '')}px)`,
    opacity: currentPulseOpacity
  }

  const glowShadowOpacity = glow ? 0.3 + (currentGlowProgress * 0.3) : 0
  const glowStyle: CSSProperties = glow ? {
    boxShadow: `0 0 20px rgba(var(--primary), ${String(glowShadowOpacity ?? '')})`
  } : {}

  const shimmerStyle: CSSProperties = shimmer && !disabled ? {
    transform: `translateX(${String(currentShimmerX ?? '')}%)`,
    opacity: 0.3
  } : {}

  return (
    <div
      className="inline-block"
      role="presentation"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={containerStyle}
    >
      <Button
        variant={variant}
        size={size}
        onClick={handlePress}
        disabled={disabled}
        type={type}
        aria-label={ariaLabel}
        className={cn(
          'relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          glow && 'shadow-lg shadow-primary/30',
          className
        )}
        style={glowStyle}
      >
        {shimmer && !disabled && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              ...shimmerStyle,
              backgroundSize: '200% 100%',
              zIndex: 1,
              maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    </div>
  )
}
