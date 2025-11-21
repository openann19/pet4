/**
 * Enhanced Keyboard Navigation Hook (Web)
 *
 * Provides comprehensive keyboard navigation support:
 * - Full keyboard shortcuts for common actions (Ctrl+S save, Ctrl+K search, etc.)
 * - Tab order management with visual indicators
 * - Enhanced focus trap for modals with better edge case handling
 * - Keyboard navigation hints and tooltips
 * - Arrow key navigation in lists and grids
 * - Focus management utilities
 *
 * Location: apps/web/src/hooks/accessibility/use-keyboard-navigation.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/lib/logger'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

const logger = createLogger('keyboard-navigation')

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  readonly key: string
  readonly ctrl?: boolean
  readonly meta?: boolean
  readonly shift?: boolean
  readonly alt?: boolean
  readonly preventDefault?: boolean
  readonly stopPropagation?: boolean
  readonly description?: string
  readonly category?: string
}

/**
 * Tab order configuration
 */
export interface TabOrderConfig {
  readonly enabled?: boolean
  readonly visualIndicator?: boolean
  readonly indicatorStyle?: 'outline' | 'ring' | 'shadow'
  readonly cycle?: boolean
}

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  readonly enabled?: boolean
  readonly returnFocusOnCleanup?: boolean
  readonly autoFocus?: boolean
  readonly container?: HTMLElement | null
  readonly initialFocus?: HTMLElement | null
}

/**
 * Arrow key navigation configuration
 */
export interface ArrowKeyNavigationConfig {
  readonly enabled?: boolean
  readonly orientation?: 'horizontal' | 'vertical' | 'both'
  readonly wrap?: boolean
  readonly skipHidden?: boolean
}

/**
 * Keyboard navigation options
 */
export interface UseKeyboardNavigationOptions {
  readonly shortcuts?: Record<string, KeyboardShortcut | ((event: KeyboardEvent) => void)>
  readonly enabled?: boolean
  readonly tabOrder?: TabOrderConfig
  readonly focusTrap?: FocusTrapConfig
  readonly arrowKeys?: ArrowKeyNavigationConfig
  readonly onShortcut?: (name: string, event: KeyboardEvent) => void
  readonly showHints?: boolean
}

/**
 * Keyboard navigation return type
 */
export interface UseKeyboardNavigationReturn {
  readonly isActive: boolean
  readonly activeShortcut: string | null
  readonly registerShortcut: (name: string, shortcut: KeyboardShortcut, handler: (event: KeyboardEvent) => void) => void
  readonly unregisterShortcut: (name: string) => void
  readonly activateFocusTrap: (config?: FocusTrapConfig) => void
  readonly deactivateFocusTrap: () => void
  readonly isFocusTrapActive: boolean
  readonly focusNext: () => void
  readonly focusPrevious: () => void
  readonly focusFirst: () => void
  readonly focusLast: () => void
  readonly handlers: {
    readonly onKeyDown: (e: ReactKeyboardEvent | KeyboardEvent) => void
    readonly onKeyUp: (e: ReactKeyboardEvent | KeyboardEvent) => void
  }
}

const DEFAULT_ENABLED = true
const DEFAULT_TAB_ORDER_ENABLED = true
const DEFAULT_FOCUS_TRAP_ENABLED = false
const DEFAULT_ARROW_KEYS_ENABLED = true

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

/**
 * Get focusable elements in container
 */
function getFocusableElements(container: HTMLElement | Document = document): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  )
  return elements.filter((el) => {
    // Filter out hidden elements
    const style = window.getComputedStyle(el)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      el.offsetParent !== null &&
      !el.hasAttribute('aria-hidden')
    )
  })
}

/**
 * Check if event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false
  }

  if (shortcut.ctrl !== undefined && shortcut.ctrl !== (event.ctrlKey || event.metaKey)) {
    return false
  }

  if (shortcut.meta !== undefined && shortcut.meta !== event.metaKey) {
    return false
  }

  if (shortcut.shift !== undefined && shortcut.shift !== event.shiftKey) {
    return false
  }

  if (shortcut.alt !== undefined && shortcut.alt !== event.altKey) {
    return false
  }

  return true
}

/**
 * Enhanced keyboard navigation hook
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn {
  const {
    shortcuts: initialShortcuts = {},
    enabled = DEFAULT_ENABLED,
    tabOrder = { enabled: DEFAULT_TAB_ORDER_ENABLED },
    focusTrap: focusTrapConfig = { enabled: DEFAULT_FOCUS_TRAP_ENABLED },
    arrowKeys: arrowKeysConfig = { enabled: DEFAULT_ARROW_KEYS_ENABLED },
    onShortcut,
    showHints = false,
  } = options

  // State
  const [isActive, setIsActive] = useState(enabled)
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null)
  const [isFocusTrapActive, setIsFocusTrapActive] = useState(false)

  // Refs
  const shortcutsRef = useRef<Map<string, { shortcut: KeyboardShortcut; handler: (event: KeyboardEvent) => void }>>(new Map())
  const focusTrapContainerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const indicatorElementRef = useRef<HTMLElement | null>(null)

  // Initialize shortcuts
  useEffect(() => {
    shortcutsRef.current.clear()
    Object.entries(initialShortcuts).forEach(([name, shortcutOrHandler]) => {
      if (typeof shortcutOrHandler === 'function') {
        // Simple handler function - create default shortcut
        const handler = shortcutOrHandler
        const shortcut: KeyboardShortcut = {
          key: name,
          preventDefault: true,
        }
        shortcutsRef.current.set(name, { shortcut, handler })
      } else {
        // Shortcut object - need handler from options
        const shortcut = shortcutOrHandler
        const handler = (event: KeyboardEvent) => {
          onShortcut?.(name, event)
        }
        shortcutsRef.current.set(name, { shortcut, handler })
      }
    })
  }, [initialShortcuts, onShortcut])

  // Register shortcut
  const registerShortcut = useCallback(
    (name: string, shortcut: KeyboardShortcut, handler: (event: KeyboardEvent) => void) => {
      shortcutsRef.current.set(name, { shortcut, handler })
      logger.debug('Shortcut registered', { name, shortcut })
    },
    []
  )

  // Unregister shortcut
  const unregisterShortcut = useCallback((name: string) => {
    shortcutsRef.current.delete(name)
    logger.debug('Shortcut unregistered', { name })
  }, [])

  // Focus trap activation
  const activateFocusTrap = useCallback(
    (config: FocusTrapConfig = {}) => {
      if (!focusTrapConfig.enabled && !config.enabled) {
        return
      }

      const {
        enabled: trapEnabled = true,
        returnFocusOnCleanup = true,
        autoFocus = true,
        container,
        initialFocus,
      } = { ...focusTrapConfig, ...config }

      if (!trapEnabled) {
        return
      }

      // Store current focus
      if (returnFocusOnCleanup) {
        previousFocusRef.current = document.activeElement as HTMLElement
      }

      // Set container
      const trapContainer = container ?? focusTrapContainerRef.current ?? document.body
      focusTrapContainerRef.current = trapContainer

      // Get focusable elements
      const focusableElements = getFocusableElements(trapContainer)

      if (focusableElements.length === 0) {
        logger.warn('No focusable elements found for focus trap')
        return
      }

      // Auto-focus first element or specified element
      if (autoFocus) {
        if (initialFocus && focusableElements.includes(initialFocus)) {
          initialFocus.focus()
        } else {
          focusableElements[0]?.focus()
        }
      }

      setIsFocusTrapActive(true)
      logger.debug('Focus trap activated', { elementCount: focusableElements.length })
    },
    [focusTrapConfig]
  )

  // Focus trap deactivation
  const deactivateFocusTrap = useCallback(() => {
    if (!focusTrapConfig.enabled) {
      return
    }

    setIsFocusTrapActive(false)
    focusTrapContainerRef.current = null

    // Return focus to previous element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }

    logger.debug('Focus trap deactivated')
  }, [focusTrapConfig.enabled])

  // Focus navigation
  const focusNext = useCallback(() => {
    const container = focusTrapContainerRef.current ?? document.body
    const focusableElements = getFocusableElements(container)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1]?.focus()
    } else if (tabOrder.cycle) {
      focusableElements[0]?.focus()
    }
  }, [tabOrder.cycle])

  const focusPrevious = useCallback(() => {
    const container = focusTrapContainerRef.current ?? document.body
    const focusableElements = getFocusableElements(container)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1]?.focus()
    } else if (tabOrder.cycle) {
      focusableElements[focusableElements.length - 1]?.focus()
    }
  }, [tabOrder.cycle])

  const focusFirst = useCallback(() => {
    const container = focusTrapContainerRef.current ?? document.body
    const focusableElements = getFocusableElements(container)
    focusableElements[0]?.focus()
  }, [])

  const focusLast = useCallback(() => {
    const container = focusTrapContainerRef.current ?? document.body
    const focusableElements = getFocusableElements(container)
    const lastIndex = focusableElements.length - 1
    if (lastIndex >= 0) {
      focusableElements[lastIndex]?.focus()
    }
  }, [])

  // Arrow key navigation
  const handleArrowKeyNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (!arrowKeysConfig.enabled) {
        return
      }

      const { orientation = 'both', wrap = false, _skipHidden = true } = arrowKeysConfig

      const container = focusTrapContainerRef.current ?? document.body
      const focusableElements = getFocusableElements(container)
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

      if (currentIndex === -1) {
        return
      }

      let nextIndex = currentIndex

      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault()
            nextIndex = wrap && currentIndex === focusableElements.length - 1
              ? 0
              : Math.min(currentIndex + 1, focusableElements.length - 1)
          }
          break
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault()
            nextIndex = wrap && currentIndex === 0
              ? focusableElements.length - 1
              : Math.max(currentIndex - 1, 0)
          }
          break
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault()
            nextIndex = wrap && currentIndex === focusableElements.length - 1
              ? 0
              : Math.min(currentIndex + 1, focusableElements.length - 1)
          }
          break
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault()
            nextIndex = wrap && currentIndex === 0
              ? focusableElements.length - 1
              : Math.max(currentIndex - 1, 0)
          }
          break
        default:
          return
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex]?.focus()
      }
    },
    [arrowKeysConfig]
  )

  // Tab order visual indicator
  useEffect(() => {
    if (!tabOrder.visualIndicator || !tabOrder.enabled) {
      return
    }

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (!target) {
        return
      }

      // Remove previous indicator
      if (indicatorElementRef.current) {
        indicatorElementRef.current.classList.remove('keyboard-focus-indicator')
        indicatorElementRef.current = null
      }

      // Add indicator to focused element
      if (target.matches(FOCUSABLE_SELECTOR)) {
        target.classList.add('keyboard-focus-indicator')
        indicatorElementRef.current = target
      }
    }

    const handleBlur = () => {
      if (indicatorElementRef.current) {
        indicatorElementRef.current.classList.remove('keyboard-focus-indicator')
        indicatorElementRef.current = null
      }
    }

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)

    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
    }
  }, [tabOrder.visualIndicator, tabOrder.enabled])

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent | KeyboardEvent) => {
      if (!isActive) {
        return
      }

      const nativeEvent = 'nativeEvent' in event ? (event.nativeEvent) : event

      // Handle focus trap Tab key
      if (isFocusTrapActive && nativeEvent.key === 'Tab') {
        const container = focusTrapContainerRef.current ?? document.body
        const focusableElements = getFocusableElements(container)

        if (focusableElements.length === 0) {
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (nativeEvent.shiftKey) {
          // Shift+Tab: focus previous
          if (document.activeElement === firstElement) {
            nativeEvent.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab: focus next
          if (document.activeElement === lastElement) {
            nativeEvent.preventDefault()
            firstElement?.focus()
          }
        }
        return
      }

      // Handle arrow key navigation
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(nativeEvent.key)) {
        handleArrowKeyNavigation(nativeEvent)
      }

      // Handle shortcuts
      for (const [name, { shortcut, handler }] of shortcutsRef.current.entries()) {
        if (matchesShortcut(nativeEvent, shortcut)) {
          if (shortcut.preventDefault !== false) {
            nativeEvent.preventDefault()
          }
          if (shortcut.stopPropagation) {
            nativeEvent.stopPropagation()
          }
          setActiveShortcut(name)
          handler(nativeEvent)
          onShortcut?.(name, nativeEvent)
          setTimeout(() => setActiveShortcut(null), 200)
          break
        }
      }
    },
    [isActive, isFocusTrapActive, handleArrowKeyNavigation, onShortcut]
  )

  const handleKeyUp = useCallback(() => {
    // Key up handler for future extensions
  }, [])

  // Enable/disable hook
  useEffect(() => {
    setIsActive(enabled)
  }, [enabled])

  return {
    isActive,
    activeShortcut,
    registerShortcut,
    unregisterShortcut,
    activateFocusTrap,
    deactivateFocusTrap,
    isFocusTrapActive,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    handlers: {
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp,
    },
  }
}

/**
 * Predefined keyboard shortcuts
 */
export const keyboardShortcuts = {
  // Navigation
  focusInput: 'Ctrl+K',
  toggleHelp: '?',
  closeModal: 'Escape',
  cancel: 'Escape',

  // Actions
  submit: 'Ctrl+Enter',
  generate: 'Ctrl+Enter',
  save: 'Ctrl+S',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',

  // Movement
  next: 'ArrowDown',
  previous: 'ArrowUp',
  nextTab: 'Tab',
  previousTab: 'Shift+Tab',

  // Editing
  selectAll: 'Ctrl+A',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  cut: 'Ctrl+X',
  delete: 'Delete',
  backspace: 'Backspace',
} as const
