import type { ReactNode } from 'react';
import { useEffect, useCallback, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';

export interface DismissibleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnAndroidBack?: boolean;
  trapFocus?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

export function DismissibleOverlay({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  closeOnAndroidBack = true,
  trapFocus = true,
  className,
  overlayClassName,
  contentClassName,
}: DismissibleOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const overlayPresence = useAnimatePresence({
    isVisible: isOpen,
    enterTransition: 'fade',
    exitTransition: 'fade',
    enterDuration: 200,
    exitDuration: 200,
  });

  const contentPresence = useAnimatePresence({
    isVisible: isOpen,
    enterTransition: 'scale',
    exitTransition: 'scale',
    enterDuration: 200,
    exitDuration: 200,
  });

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  const handleAndroidBack = useCallback(
    (e: PopStateEvent) => {
      if (closeOnAndroidBack && isOpen) {
        e.preventDefault();
        onClose();
      }
    },
    [closeOnAndroidBack, isOpen, onClose]
  );

  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [closeOnOutsideClick, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (trapFocus && document.activeElement) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    if (closeOnEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    if (closeOnAndroidBack) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handleAndroidBack);
    }

    if (closeOnOutsideClick) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    if (trapFocus && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleOutsideClick);
        window.removeEventListener('popstate', handleAndroidBack);

        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('popstate', handleAndroidBack);
    };
  }, [
    isOpen,
    closeOnEscape,
    closeOnOutsideClick,
    closeOnAndroidBack,
    trapFocus,
    handleEscape,
    handleOutsideClick,
    handleAndroidBack,
  ]);

  if (!overlayPresence.shouldRender && !contentPresence.shouldRender) {
    return null;
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
      {overlayPresence.shouldRender && (
        <AnimatedView
          style={overlayPresence.animatedStyle}
          className={cn('absolute inset-0 bg-background/80 backdrop-blur-sm', overlayClassName)}
          aria-hidden="true"
          onClick={closeOnOutsideClick ? onClose : undefined}
        />
      )}

      {contentPresence.shouldRender && (
        <div
          ref={contentRef}
          className={cn(
            'relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden',
            contentClassName
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'overlay-title' : undefined}
        >
          <AnimatedView style={contentPresence.animatedStyle} className="h-full w-full">
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                {title && (
                  <h2 id="overlay-title" className="text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="ml-auto rounded-full"
                    aria-label="Close"
                  >
                    <X size={20} weight="bold" />
                  </Button>
                )}
              </div>
            )}

            <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">{children}</div>
          </AnimatedView>
        </div>
      )}
    </div>
  );
}
