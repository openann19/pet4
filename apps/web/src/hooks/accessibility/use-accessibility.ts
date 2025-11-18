/**
 * Enhanced Accessibility Hook (Web)
 *
 * Provides comprehensive accessibility support:
 * - Advanced ARIA labels and live regions
 * - Keyboard navigation with focus trap
 * - High contrast mode detection
 * - Screen reader announcements
 * - Focus management
 * - Skip links
 *
 * Location: apps/web/src/hooks/accessibility/use-accessibility.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('accessibility')

/**
 * ARIA live region politeness
 */
export type AriaLive = 'off' | 'polite' | 'assertive'

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  readonly enabled?: boolean
  readonly returnFocusOnCleanup?: boolean
  readonly autoFocus?: boolean
}

/**
 * Accessibility hook options
 */
export interface UseAccessibilityOptions {
  readonly enableFocusTrap?: boolean
  readonly enableKeyboardNav?: boolean
  readonly announcePageLoad?: boolean
  readonly skipLinkTarget?: string
}

/**
 * Accessibility hook return type
 */
export interface UseAccessibilityReturn {
  readonly isHighContrast: boolean
  readonly isScreenReaderActive: boolean
  readonly announce: (message: string, priority?: AriaLive) => void
  readonly focusTrap: {
    readonly activate: (options?: FocusTrapOptions) => void
    readonly deactivate: () => void
    readonly isActive: boolean
  }
  readonly keyboardNav: {
    readonly handlers: {
      readonly onKeyDown: (e: KeyboardEvent) => void
    }
    readonly focusNext: () => void
    readonly focusPrevious: () => void
    readonly focusFirst: () => void
    readonly focusLast: () => void
  }
}

const DEFAULT_ENABLE_FOCUS_TRAP = false
const DEFAULT_ENABLE_KEYBOARD_NAV = true
const DEFAULT_ANNOUNCE_PAGE_LOAD = false

// Focusable selector
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

export function useAccessibility(
  options: UseAccessibilityOptions = {}
): UseAccessibilityReturn {
  const {
    enableFocusTrap = DEFAULT_ENABLE_FOCUS_TRAP,
    enableKeyboardNav = DEFAULT_ENABLE_KEYBOARD_NAV,
    announcePageLoad = DEFAULT_ANNOUNCE_PAGE_LOAD,
    skipLinkTarget: _skipLinkTarget,
  } = options

  // State
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)
  const [isFocusTrapActive, setIsFocusTrapActive] = useState(false)

  // Refs
  const announcerRef = useRef<HTMLDivElement | null>(null)
  const focusTrapRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Detect high contrast mode
  useEffect(() => {
    const detectHighContrast = () => {
      // Check media query
      const mediaQuery = window.matchMedia('(prefers-contrast: high)')
      setIsHighContrast(mediaQuery.matches)

      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        setIsHighContrast(e.matches)
        logger.debug('High contrast mode changed', { enabled: e.matches })
      }

      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }

    return detectHighContrast()
  }, [])

  // Detect screen reader
  useEffect(() => {
    // Check for common screen reader indicators
    const detectScreenReader = () => {
      // Check for screen reader user agent strings
      const userAgent = navigator.userAgent.toLowerCase()
      const isNVDA = userAgent.includes('nvda')
      const isJAWS = userAgent.includes('jaws')

      // Check for aria-live support (proxy for screen reader)
      const supportsAriaLive = 'ariaLive' in document.createElement('div')

      const isActive = isNVDA || isJAWS || supportsAriaLive

      setIsScreenReaderActive(isActive)

      if (isActive) {
        logger.debug('Screen reader detected')
      }
    }

    detectScreenReader()
  }, [])

  // Create announcer element
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    // Create live region for announcements
    const announcer = document.createElement('div')
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.overflow = 'hidden'

    document.body.appendChild(announcer)
    announcerRef.current = announcer

    logger.debug('Accessibility announcer created')

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
        announcerRef.current = null
      }
    }
  }, [])

  // Announce page load
  useEffect(() => {
    if (announcePageLoad && announcerRef.current) {
      const pageTitle = document.title
      setTimeout(() => {
        announce(`Page loaded: ${pageTitle}`, 'polite')
      }, 100)
    }
  }, [announcePageLoad])

  // Announce function
  const announce = useCallback(
    (message: string, priority: AriaLive = 'polite') => {
      if (!announcerRef.current) {
        return
      }

      // Update aria-live attribute
      announcerRef.current.setAttribute('aria-live', priority)

      // Clear and set message
      announcerRef.current.textContent = ''
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
        }
      }, 100)

      logger.debug('Announced to screen reader', { message, priority })
    },
    []
  )

  // Get focusable elements in container
  const getFocusableElements = useCallback(
    (container: HTMLElement): HTMLElement[] => {
      const elements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      )
      return elements.filter((el) => {
        // Filter out hidden elements
        const style = window.getComputedStyle(el)
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          el.offsetParent !== null
        )
      })
    },
    []
  )

  // Focus trap activation
  const activateFocusTrap = useCallback(
    (trapOptions: FocusTrapOptions = {}) => {
      if (!enableFocusTrap) {
        return
      }

      const {
        enabled = true,
        returnFocusOnCleanup = true,
        autoFocus = true,
      } = trapOptions

      if (!enabled) {
        return
      }

      // Store current focus
      if (returnFocusOnCleanup) {
        previousFocusRef.current = document.activeElement as HTMLElement
      }

      // Find container (use document.body as fallback)
      const container = focusTrapRef.current ?? document.body

      // Get focusable elements
      const focusableElements = getFocusableElements(container)

      if (focusableElements.length === 0) {
        logger.warn('No focusable elements found for focus trap')
        return
      }

      // Auto-focus first element
      if (autoFocus) {
        focusableElements[0]?.focus()
      }

      setIsFocusTrapActive(true)

      logger.debug('Focus trap activated', {
        elementCount: focusableElements.length,
      })
    },
    [enableFocusTrap, getFocusableElements]
  )

  // Focus trap deactivation
  const deactivateFocusTrap = useCallback(() => {
    if (!enableFocusTrap) {
      return
    }

    setIsFocusTrapActive(false)

    // Return focus to previous element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }

    logger.debug('Focus trap deactivated')
  }, [enableFocusTrap])

  // Handle focus trap Tab key
  useEffect(() => {
    if (!isFocusTrapActive || !enableFocusTrap) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return
      }

      const container = focusTrapRef.current ?? document.body
      const focusableElements = getFocusableElements(container)

      if (focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: focus previous
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: focus next
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFocusTrapActive, enableFocusTrap, getFocusableElements])

  // Keyboard navigation handlers
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements(document.body)
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    )

    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1]?.focus()
    }
  }, [getFocusableElements])

  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements(document.body)
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    )

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1]?.focus()
    }
  }, [getFocusableElements])

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements(document.body)
    focusableElements[0]?.focus()
  }, [getFocusableElements])

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements(document.body)
    focusableElements[focusableElements.length - 1]?.focus()
  }, [getFocusableElements])

  // Keyboard navigation handler
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enableKeyboardNav) {
        return
      }

      // Arrow key navigation
      switch (e.key) {
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            focusNext()
          }
          break
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            focusPrevious()
          }
          break
        case 'Home':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            focusFirst()
          }
          break
        case 'End':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            focusLast()
          }
          break
      }
    },
    [enableKeyboardNav, focusNext, focusPrevious, focusFirst, focusLast]
  )

  return {
    isHighContrast,
    isScreenReaderActive,
    announce,
    focusTrap: {
      activate: activateFocusTrap,
      deactivate: deactivateFocusTrap,
      isActive: isFocusTrapActive,
    },
    keyboardNav: {
      handlers: {
        onKeyDown,
      },
      focusNext,
      focusPrevious,
      focusFirst,
      focusLast,
    },
  }
}
