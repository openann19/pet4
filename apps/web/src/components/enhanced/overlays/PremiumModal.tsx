'use client'

import { useEffect, useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { isTruthy, isDefined } from '@/core/guards';

export interface PremiumModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'glass' | 'centered'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

export function PremiumModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: PremiumModalProps): React.JSX.Element {
  const scale = useSharedValue(0.95)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (isTruthy(open)) {
      scale.value = withSpring(1, springConfigs.smooth)
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      scale.value = withSpring(0.95, springConfigs.smooth)
      opacity.value = withTiming(0, { duration: 150 })
    }
  }, [open, scale, opacity])

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  })) as AnimatedStyle

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && closeOnOverlayClick) {
        haptics.impact('light')
      }
      onOpenChange?.(newOpen)
    },
    [onOpenChange, closeOnOverlayClick]
  )

  const variants = {
    default: 'bg-background',
    glass: 'glass-card backdrop-blur-xl bg-background/80',
    centered: 'bg-background',
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogOverlay className="backdrop-blur-sm" />
      <DialogContent
        className={cn(
          'p-0 overflow-hidden',
          variants[variant],
          SIZE_CLASSES[size],
          className
        )}
      >
        <AnimatedView style={contentStyle} className="contents">
          {(title || description) && (
            <DialogHeader className="px-6 pt-6 pb-4">
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}

          <div className="px-6 py-4">{children}</div>

          {footer && (
            <DialogFooter className="px-6 pb-6 pt-4 border-t">{footer}</DialogFooter>
          )}

          {showCloseButton && (
            <button
              onClick={() => { handleOpenChange(false); }}
              className="absolute top-4 right-4 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          )}
        </AnimatedView>
      </DialogContent>
    </Dialog>
  )
}
