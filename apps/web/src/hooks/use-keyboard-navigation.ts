/**
 * Comprehensive Keyboard Navigation Hook
 *
 * Enhanced keyboard navigation with modifier keys, shortcuts, and focus management.
 * Supports global and local keyboard shortcuts.
 */

import { useEffect, useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface UseKeyboardNavigationOptions {
  shortcuts?: Record<string, (event: KeyboardEvent) => void>;
  enabled?: boolean;
  target?: 'window' | 'document' | 'element';
  preventDefault?: boolean;
}

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  if (event.key !== shortcut.key) {
    return false;
  }

  if (shortcut.ctrl && !(event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (shortcut.meta && !event.metaKey) {
    return false;
  }

  if (shortcut.shift && !event.shiftKey) {
    return false;
  }

  if (shortcut.alt && !event.altKey) {
    return false;
  }

  return true;
}

/**
 * Comprehensive keyboard navigation hook
 *
 * @example
 * ```typescript
 * useKeyboardNavigation({
 *   shortcuts: {
 *     'Ctrl+Enter': () => handleGenerate(),
 *     'Escape': () => handleCancel(),
 *     '?': () => toggleHelp(),
 *   },
 *   enabled: true,
 * });
 * ```
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
): void {
  const {
    shortcuts = {},
    enabled = true,
    target = 'window',
    preventDefault = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent | globalThis.KeyboardEvent): void => {
      if (!enabled) {
        return;
      }

      // Convert native event to React event if needed
      const reactEvent = event as KeyboardEvent;

      // Check each shortcut
      for (const [name, handler] of Object.entries(shortcutsRef.current)) {
        // Parse shortcut
        const parts = name.split('+').map((p) => p.trim());
        const key = parts[parts.length - 1] ?? '';
        const hasCtrl = parts.some((p) => p.toLowerCase() === 'ctrl' || p.toLowerCase() === 'cmd');
        const hasMeta = parts.some((p) => p.toLowerCase() === 'meta');
        const hasShift = parts.some((p) => p.toLowerCase() === 'shift');
        const hasAlt = parts.some((p) => p.toLowerCase() === 'alt');

        const shortcut: KeyboardShortcut = {
          key,
          ctrl: hasCtrl,
          meta: hasMeta,
          shift: hasShift,
          alt: hasAlt,
        };

        if (matchesShortcut(reactEvent, shortcut)) {
          if (preventDefault) {
            reactEvent.preventDefault();
          }
          handler(reactEvent);
          break;
        }
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element =
      target === 'window'
        ? window
        : target === 'document'
          ? document
          : null;

    if (!element) {
      return;
    }

    element.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, target, handleKeyDown]);
}

/**
 * Predefined keyboard shortcuts for common actions
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
} as const;
