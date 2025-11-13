'use client';

import React, { type ComponentProps } from 'react';
import { useEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, animate } from '@petspark/motion';

import { cn } from '@/lib/utils';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { Motion } from '@/core/tokens/motion';
import { haptics } from '@/lib/haptics';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaButtonAttributes } from '@/lib/accessibility';

export interface DialogProps extends ComponentProps<typeof DialogPrimitive.Root> {
  hapticFeedback?: boolean;
}

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;
  hapticFeedback?: boolean;
}

function Dialog({ hapticFeedback = true, ...props }: DialogProps): React.JSX.Element {
  const handleOpenChange = useCallback(
    (open: boolean): void => {
      if (hapticFeedback && open) {
        haptics.trigger('light');
      }
      props.onOpenChange?.(open);
    },
    [hapticFeedback, props]
  );

  return <DialogPrimitive.Root data-slot="dialog" {...props} onOpenChange={handleOpenChange} />;
}

function DialogTrigger({
  ...props
}: ComponentProps<typeof DialogPrimitive.Trigger>): React.JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>): React.JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>): React.JSX.Element {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
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
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  ...props
}: DialogContentProps): React.JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const y = useSharedValue(20);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      scale.value = 1;
      y.value = 0;
      return;
    }
    const opacityTransition = withTiming(1, {
      duration: Motion.components.modal.open.duration,
    });
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const scaleTransition = withSpring(1, springConfigs.smooth);
    animate(scale, scaleTransition.target, scaleTransition.transition);
    const yTransition = withSpring(0, springConfigs.smooth);
    animate(y, yTransition.target, yTransition.transition);
  }, [opacity, scale, y, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [{ scale: scale.get() }, { translateY: y.get() }],
    };
  });

  const handleClose = useCallback((): void => {
    if (hapticFeedback) {
      haptics.trigger('light');
    }
  }, [hapticFeedback]);

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]',
          'translate-x-[-50%] translate-y-[-50%]',
          'rounded-2xl border border-(--color-neutral-6) bg-(--color-bg-overlay) shadow-lg',
          'focus:outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'sm:max-w-lg',
          getSpacingClassesFromConfig({ gap: 'lg', padding: 'xl' }),
          className
        )}
        {...props}
      >
        <AnimatedView style={animatedStyle} className="contents">
          {children}
        </AnimatedView>
        {showCloseButton && (
          <DialogPrimitive.Close
        className={cn(
          'absolute rounded-xs opacity-70 min-w-[44px] min-h-[44px]',
          'ring-offset-background',
          prefersReducedMotion ? '' : 'transition-opacity duration-200',
          'hover:opacity-100 focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
          'focus-visible:outline-none disabled:pointer-events-none',
          'text-(--text-muted) hover:text-(--text-primary)',
          '[&_svg]:pointer-events-none [&_svg]:shrink-0',
          "[&_svg:not([class*='size-'])]:size-4",
          getSpacingClassesFromConfig({ marginY: 'lg', marginX: 'lg' }),
          getSpacingClassesFromConfig({ padding: 'xs' })
        )}
            onClick={handleClose}
            {...getAriaButtonAttributes({ label: 'Close dialog' })}
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col text-center sm:text-left',
        getSpacingClassesFromConfig({ gap: 'sm' }),
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end',
        getSpacingClassesFromConfig({ gap: 'sm' }),
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        getTypographyClasses('h3'),
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-(--text-muted)',
        getTypographyClasses('caption'),
        className
      )}
      {...props}
    />
  );
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
};
