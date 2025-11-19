'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useSharedValue, usewithSpring, withTiming, MotionView   type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { X, Trash } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  messagePreview?: string;
  context?: 'self-delete' | 'admin-delete';
  className?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  messagePreview,
  context = 'self-delete',
  className,
}: DeleteConfirmationModalProps) {
  const _uiConfig = useUIConfig();
  const scale = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(0);
  const backdropOpacity = useSharedValue<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const modalStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleConfirm = useCallback(() => {
    haptics.impact('medium');
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    haptics.selection();
    onCancel();
  }, [onCancel]);

  // Focus management and trap
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal when it opens
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    scale.value = 0;
    opacity.value = 0;
    backdropOpacity.value = 0;
    return null;
  }

  scale.value = withSpring(1, springConfigs.bouncy);
  opacity.value = withTiming(1, timingConfigs.fast);
  backdropOpacity.value = withTiming(0.5, timingConfigs.fast);

  return (
    <MotionView
      style={backdropStyle}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        className
      )}
      onClick={() => void handleCancel()}
    >
      <MotionView
        style={modalStyle}
        className={cn(
          'bg-card border border-border rounded-2xl shadow-2xl',
          'p-6 max-w-sm w-full mx-4',
          'transform-gpu',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
        )}
        onClick={(e?: React.MouseEvent) => {
          if (e) {
            e.stopPropagation();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                context === 'admin-delete' ? 'bg-destructive/20' : 'bg-muted'
              )}
              aria-hidden="true"
            >
              <Trash
                size={24}
                className={cn(context === 'admin-delete' ? 'text-destructive' : 'text-foreground')}
                weight="bold"
                aria-hidden="true"
              />
            </div>
            <h3 id="delete-confirmation-title" className="text-lg font-semibold text-foreground">
              {context === 'admin-delete' ? 'Delete Message' : 'Delete this message?'}
            </h3>
          </div>
          <button
            onClick={() => void handleCancel()}
            className="p-1 hover:bg-muted rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X size={20} className="text-muted-foreground" aria-hidden="true" />
          </button>
        </div>

        {messagePreview && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg" aria-hidden="true">
            <p className="text-sm text-muted-foreground line-clamp-2">{messagePreview}</p>
          </div>
        )}

        <p id="delete-confirmation-description" className="text-sm text-muted-foreground mb-6">
          {context === 'admin-delete'
            ? 'This message will be permanently removed from the chat.'
            : 'This action cannot be undone.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => void handleCancel()}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-muted hover:bg-muted/80',
              'text-foreground font-medium',
              'transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'min-h-[44px]'
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-destructive hover:bg-destructive/90',
              'text-destructive-foreground font-medium',
              'transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'min-h-[44px]'
            )}
          >
            Delete
          </button>
        </div>
      </MotionView>
    </MotionView>
  );
}
