'use client'

import { useCallback, useRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { useRippleEffect } from '@/effects/reanimated/use-ripple-effect'
import { useMagneticHover } from '@/effects/reanimated/use-magnetic-hover'
import { springConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { Dimens } from '@/core/tokens/dimens'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ghost' | 'outline' | 'glass'
  enableRipple?: boolean
  enableMagnetic?: boolean
  enableGlow?: boolean
  'aria-label': string
}

const SIZE_CONFIG = {
  sm: {
    size: 32,
    iconSize: 16,
    padding: 8,
  },
  md: {
    size: 44,
    iconSize: 20,
    padding: 12,
  },
  lg: {
    size: 56,
    iconSize: 24,
    padding: 16,
  },
} as const

export function IconButton({
  icon,
  size = 'md',
  variant = 'primary',
  enableRipple = true,
  enableMagnetic = true,
  enableGlow = false,
  className,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  ...props
}: IconButtonProps): React.JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const glowOpacity = useSharedValue(0)
  const isActive = useSharedValue(0)

  const hoverLift = useHoverLift({
    scale: 1.1,
    translateY: -2,
    damping: 25,
    stiffness: 400,
  })

  const magnetic = useMagneticHover({
    strength: 0.2,
    maxDistance: 8,
    enabled: enableMagnetic && !disabled,
  })

  const ripple = useRippleEffect({
    duration: 600,
    color: variant === 'primary' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    opacity: 0.5,
  })

  const glowStyle = useAnimatedStyle(() => {
    if (!enableGlow) return {}
    return {
      opacity: glowOpacity.value,
      boxShadow: `0 0 ${Dimens.glowSpread * 2}px rgba(59, 130, 246, ${glowOpacity.value * 0.6})`,
    }
  }) as AnimatedStyle

  const handleMouseEnter = useCallback(() => {
    if (disabled) return
    hoverLift.handleEnter()
    magnetic.handleMouseEnter()
    if (enableGlow) {
      glowOpacity.value = withSpring(1, springConfigs.smooth)
    }
  }, [disabled, hoverLift, magnetic, enableGlow, glowOpacity])

  const handleMouseLeave = useCallback(() => {
    hoverLift.handleLeave()
    magnetic.handleMouseLeave()
    if (enableGlow) {
      glowOpacity.value = withSpring(0, springConfigs.smooth)
    }
  }, [hoverLift, magnetic, enableGlow, glowOpacity])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return

      if (enableRipple) {
        ripple.addRipple(e)
      }

      haptics.impact('light')

      isActive.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 200 })
      )

      onClick?.(e)
    },
    [disabled, enableRipple, ripple, onClick, isActive]
  )

  const activeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - isActive.value * 0.1 }],
  })) as AnimatedStyle

  const config = SIZE_CONFIG[size]
  const variantStyles = {
    primary: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover-bg)] active:bg-[var(--btn-primary-press-bg)]',
    ghost: 'bg-transparent text-[var(--btn-ghost-fg)] hover:bg-[var(--btn-ghost-hover-bg)] active:bg-[var(--btn-ghost-press-bg)]',
    outline: 'bg-transparent border-2 border-[var(--btn-primary-bg)] text-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-fg)]',
    glass: 'glass-card text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover-bg)]',
  }

  return (
    <div
      ref={magnetic.handleRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={magnetic.handleMouseMove}
      className="inline-block relative"
    >
      <AnimatedView style={magnetic.animatedStyle}>
        <AnimatedView style={hoverLift.animatedStyle}>
          <AnimatedView style={activeStyle}>
            <button
              ref={buttonRef}
              onClick={handleClick}
              disabled={disabled}
              aria-label={ariaLabel}
              className={cn(
                'relative overflow-hidden rounded-xl font-semibold',
                'transition-all duration-300',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                variantStyles[variant],
                className
              )}
              style={{
                width: config.size,
                height: config.size,
                minWidth: config.size,
                minHeight: config.size,
                ...(props.style as React.CSSProperties),
                '--tw-ring-color': 'var(--btn-primary-focus-ring)',
              } as React.CSSProperties}
              {...props}
            >
              {enableGlow && (
                <AnimatedView
                  style={glowStyle}
                  className="absolute inset-0 pointer-events-none rounded-xl"
                >
                  <div />
                </AnimatedView>
              )}
              <span
                className="relative z-10 flex items-center justify-center"
                style={{
                  width: config.iconSize,
                  height: config.iconSize,
                }}
              >
                {icon}
              </span>
              {enableRipple &&
                ripple.ripples.map((r) => (
                  <AnimatedView
                    key={r.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: r.x,
                      top: r.y,
                      width: config.size,
                      height: config.size,
                      backgroundColor: ripple.color,
                      ...ripple.animatedStyle,
                    }}
                  >
                    <div />
                  </AnimatedView>
                ))}
            </button>
          </AnimatedView>
        </AnimatedView>
      </AnimatedView>
    </div>
  )
}

