import type { ComponentProps } from 'react';
import { forwardRef, useRef } from 'react'
import type { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'
import { MicroInteractions } from '@/effects/micro-interactions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'

export interface EnhancedButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  ripple?: boolean
  hapticFeedback?: boolean
  successAnimation?: boolean
  asChild?: boolean
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    ripple = true, 
    hapticFeedback = true,
    successAnimation = false,
    onClick,
    className,
    children,
    ...props 
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)

    const isPromise = (value: unknown): value is Promise<unknown> => {
      return value != null && typeof value === 'object' && 'then' in value && typeof (value as any).then === 'function'
    }

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      const element = buttonRef.current || e.currentTarget

      if (ripple) {
        MicroInteractions.createRipple(element, e.nativeEvent)
      }

      if (hapticFeedback) {
        haptics.impact('light')
      }

      if (onClick) {
        try {
          const result = onClick(e)
          
          if (isPromise(result)) {
            await result
            if (successAnimation) {
              MicroInteractions.animateSuccess(element)
              if (hapticFeedback) {
                haptics.notification('success')
              }
            }
          }
        } catch {
          MicroInteractions.animateError(element)
          if (hapticFeedback) {
            haptics.notification('error')
          }
        }
      }
    }

    return (
      <Button
        ref={ref || buttonRef}
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-md',
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

EnhancedButton.displayName = 'EnhancedButton'
