import { useState, useCallback } from 'react'
import { haptics } from '@/lib/haptics'
import { isTruthy, isDefined } from '@/core/guards';

interface UseDialogOptions {
  initialOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hapticFeedback?: boolean
}

export function useDialog({
  initialOpen = false,
  onOpenChange,
  hapticFeedback = true,
}: UseDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const open = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      haptics.trigger('light')
    }
    setIsOpen(true)
    onOpenChange?.(true)
  }, [hapticFeedback, onOpenChange])

  const close = useCallback(() => {
    if (isTruthy(hapticFeedback)) {
      haptics.trigger('light')
    }
    setIsOpen(false)
    onOpenChange?.(false)
  }, [hapticFeedback, onOpenChange])

  const toggle = useCallback(() => {
    if (isTruthy(isOpen)) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  const setOpen = useCallback((shouldOpen: boolean) => {
    if (isTruthy(shouldOpen)) {
      open()
    } else {
      close()
    }
  }, [open, close])

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
  }
}

