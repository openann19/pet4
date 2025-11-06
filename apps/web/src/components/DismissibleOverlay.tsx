import type { ReactNode } from 'react';
import { useEffect, useCallback, useRef } from 'react'
import { motion, Presence } from '@petspark/motion'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DismissibleOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showCloseButton?: boolean
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  closeOnAndroidBack?: boolean
  trapFocus?: boolean
  className?: string
  overlayClassName?: string
  contentClassName?: string
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
  contentClassName
}: DismissibleOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [closeOnEscape, onClose])

  const handleAndroidBack = useCallback((e: PopStateEvent) => {
    if (closeOnAndroidBack && isOpen) {
      e.preventDefault()
      onClose()
    }
  }, [closeOnAndroidBack, isOpen, onClose])

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (
      closeOnOutsideClick &&
      contentRef.current &&
      !contentRef.current.contains(e.target as Node)
    ) {
      onClose()
    }
  }, [closeOnOutsideClick, onClose])

  useEffect(() => {
    if (!isOpen) return

    if (trapFocus && document.activeElement) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }

    if (closeOnEscape) {
      document.addEventListener('keydown', handleEscape)
    }

    if (closeOnAndroidBack) {
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handleAndroidBack)
    }

    if (closeOnOutsideClick) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    if (trapFocus && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }

      document.addEventListener('keydown', handleTabKey)
      firstElement?.focus()

      return () => {
        document.removeEventListener('keydown', handleTabKey)
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('mousedown', handleOutsideClick)
        window.removeEventListener('popstate', handleAndroidBack)
        
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('popstate', handleAndroidBack)
    }
  }, [isOpen, closeOnEscape, closeOnOutsideClick, closeOnAndroidBack, trapFocus, handleEscape, handleOutsideClick, handleAndroidBack])

  return (
    <Presence>
      {isOpen && (
        <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
          <MotionView
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute inset-0 bg-background/80 backdrop-blur-sm',
              overlayClassName
            )}
            aria-hidden="true"
          />
          
          <MotionView
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden',
              contentClassName
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'overlay-title' : undefined}
          >
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
            
            <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
              {children}
            </div>
          </MotionView>
        </div>
      )}
    </Presence>
  )
}
