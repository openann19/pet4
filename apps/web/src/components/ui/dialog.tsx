'use client'

import type { ComponentProps } from 'react'
import { useEffect, useCallback } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated'

import { cn } from '@/lib/utils'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { springConfigs } from '@/effects/reanimated/transitions'
import { Motion } from '@/core/tokens/motion'
import { haptics } from '@/lib/haptics'
import { isTruthy, isDefined } from '@/core/guards';

export interface DialogProps extends ComponentProps<typeof DialogPrimitive.Root> {
  hapticFeedback?: boolean
}

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean
  hapticFeedback?: boolean
}

function Dialog({
  hapticFeedback = true,
  ...props
}: DialogProps): React.JSX.Element {
  const handleOpenChange = useCallback((open: boolean): void => {
    if (hapticFeedback && open) {
      haptics.trigger('light')
    }
    props.onOpenChange?.(open)
  }, [hapticFeedback, props])

  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      {...props}
      onOpenChange={handleOpenChange}
    />
  )
}

function DialogTrigger({
  ...props
}: ComponentProps<typeof DialogPrimitive.Trigger>): React.JSX.Element {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
    />
  )
}

function DialogPortal({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>): React.JSX.Element {
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      {...props}
    />
  )
}

function DialogClose({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>): React.JSX.Element {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    />
  )
}

function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>): React.JSX.Element {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  ...props
}: DialogContentProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.95)
  const y = useSharedValue(20)

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: reducedMotion
        ? Motion.durations.fast
        : Motion.components.modal.open.duration,
    })
    scale.value = withSpring(1, springConfigs.smooth)
    y.value = withSpring(0, springConfigs.smooth)
  }, [opacity, scale, y, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: y.value },
      ],
    }
  }) as AnimatedStyle

  const handleClose = useCallback((): void => {
    if (isTruthy(hapticFeedback)) {
      haptics.trigger('light')
    }
  }, [hapticFeedback])

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]',
          'translate-x-[-50%] translate-y-[-50%] gap-4',
          'rounded-2xl border bg-background p-6 shadow-lg',
          'focus:outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'sm:max-w-lg',
          className
        )}
        {...props}
      >
        <AnimatedView
          style={animatedStyle}
          className="contents"
        >
          {children}
        </AnimatedView>
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute top-4 right-4 rounded-xs opacity-70',
              'ring-offset-background transition-opacity',
              'hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'focus:outline-none disabled:pointer-events-none',
              'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
              '[&_svg]:pointer-events-none [&_svg]:shrink-0',
              '[&_svg:not([class*=\'size-\'])]:size-4'
            )}
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <X />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-2 text-center sm:text-left',
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
