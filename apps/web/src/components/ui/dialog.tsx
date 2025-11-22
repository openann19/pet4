'use client';

import React, { type ComponentProps } from 'react';
import { useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  MotionView,
  useOverlayTransition,
} from '@petspark/motion';

import { cn } from '@/lib/utils';
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
  // Backward compatibility wrapper - overlay is now handled in DialogContent
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-md drop-shadow-lg text-foreground',
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
  // Use canonical overlay transition hook
  // Note: Radix manages open/closed state, so we assume open=true when component renders
  const overlayTransition = useOverlayTransition({
    type: 'modal',
    isOpen: true,
  });

  const handleClose = useCallback((): void => {
    if (hapticFeedback) {
      haptics.trigger('light');
    }
  }, [hapticFeedback]);

  return (
    <DialogPortal data-slot="dialog-portal">
      <MotionView {...overlayTransition.backdropProps}>
        <DialogPrimitive.Overlay
          data-slot="dialog-overlay"
          className={cn(
            'fixed inset-0 z-50 bg-background/80 backdrop-blur-md drop-shadow-lg text-foreground',
            className
          )}
        />
      </MotionView>
      <MotionView {...overlayTransition.contentProps}>
        <DialogPrimitive.Content
          data-slot="dialog-content"
          role="dialog"
          aria-modal="true"
          className={cn(
            'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]',
            'translate-x-[-50%] translate-y-[-50%]',
            'rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/30',
            'focus:outline-none',
            'sm:max-w-lg',
            getSpacingClassesFromConfig({ gap: 'lg', padding: 'xl' }),
            className
          )}
          {...props}
        >
          {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute rounded-full opacity-70 min-w-[44px] min-h-[44px]',
              'ring-offset-background',
              'transition-opacity duration-200',
              'hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'focus-visible:outline-none disabled:pointer-events-none',
              'text-muted-foreground hover:text-foreground bg-muted/20 backdrop-blur-sm',
              '[&_svg]:pointer-events-none [&_svg]:shrink-0',
              "[&_svg:not([class*='size-'])]:size-4",
              getSpacingClassesFromConfig({ marginY: 'lg', marginX: 'lg', padding: 'xs' })
            )}
            onClick={handleClose}
            {...getAriaButtonAttributes({ label: 'Close dialog' })}
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        </DialogPrimitive.Content>
      </MotionView>
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
        'text-muted-foreground',
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
