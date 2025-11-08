import { useState, useCallback } from 'react';
import { haptics } from '@/lib/haptics';

interface UseDialogOptions {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hapticFeedback?: boolean;
}

export function useDialog({
  initialOpen = false,
  onOpenChange,
  hapticFeedback = true,
}: UseDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    if (hapticFeedback) {
      haptics.trigger('light');
    }
    setIsOpen(true);
    onOpenChange?.(true);
  }, [hapticFeedback, onOpenChange]);

  const close = useCallback(() => {
    if (hapticFeedback) {
      haptics.trigger('light');
    }
    setIsOpen(false);
    onOpenChange?.(false);
  }, [hapticFeedback, onOpenChange]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const setOpen = useCallback(
    (shouldOpen: boolean) => {
      if (shouldOpen) {
        open();
      } else {
        close();
      }
    },
    [open, close]
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
  };
}
