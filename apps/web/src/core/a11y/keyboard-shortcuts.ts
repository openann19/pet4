/**
 * Keyboard Shortcuts Registry (WCAG 2.2 AAA)
 *
 * Provides keyboard shortcuts registry and management:
 * - Register/unregister shortcuts
 * - Handle keydown events
 * - Prevent conflicts with browser shortcuts
 * - Document shortcuts for accessibility
 *
 * Location: apps/web/src/core/a11y/keyboard-shortcuts.ts
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('keyboard-shortcuts');

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly metaKey?: boolean;
  readonly description: string;
  readonly action: () => void;
  readonly context?: string;
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
}

/**
 * Keyboard shortcuts registry
 */
export class KeyboardShortcutsRegistry {
  private shortcuts = new Map<string, KeyboardShortcut>();
  private enabled = true;
  private handler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);

    if (this.shortcuts.has(key)) {
      logger.warn('Shortcut already registered', { key, description: shortcut.description });
      return;
    }

    this.shortcuts.set(key, shortcut);
    logger?.debug?.('Registered keyboard shortcut', { key, description: shortcut.description });

    // Attach handler if not already attached
    if (!this.handler) {
      this.attachHandler();
    }
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean, metaKey?: boolean): void {
    const shortcutKey = this.buildShortcutKey(key, ctrlKey, shiftKey, altKey, metaKey);

    if (this.shortcuts.has(shortcutKey)) {
      this.shortcuts.delete(shortcutKey);
      logger?.debug?.('Unregistered keyboard shortcut', { key: shortcutKey });

      // Remove handler if no shortcuts remain
      if (this.shortcuts.size === 0 && this.handler) {
        this.detachHandler();
      }
    }
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): readonly KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts for a specific context
   */
  getShortcutsByContext(context: string): readonly KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter((shortcut) => shortcut.context === context);
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger?.debug?.('Keyboard shortcuts enabled', { enabled });
  }

  /**
   * Check if shortcuts are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Handle keydown event
   */
  handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

    const shortcutKey = this.buildShortcutKey(
      e.key,
      e.ctrlKey,
      e.shiftKey,
      e.altKey,
      e.metaKey
    );

    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      // Check if shortcut conflicts with browser shortcuts
      if (this.conflictsWithBrowserShortcut(e)) {
        logger?.debug?.('Shortcut conflicts with browser shortcut', { key: shortcutKey });
        return;
      }

      // Prevent default if specified
      if (shortcut.preventDefault !== false) {
        e.preventDefault();
      }

      // Stop propagation if specified
      if (shortcut.stopPropagation) {
        e.stopPropagation();
      }

      // Execute action
      try {
        shortcut.action();
        logger?.debug?.('Executed keyboard shortcut', { key: shortcutKey, description: shortcut.description });
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Error executing keyboard shortcut', err, { key: shortcutKey });
      }
    }
  }

  /**
   * Check if shortcut conflicts with browser shortcuts
   */
  private conflictsWithBrowserShortcut(e: KeyboardEvent): boolean {
    // Common browser shortcuts that should not be overridden
    const browserShortcuts = [
      { key: 'F1', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }, // Help
      { key: 'F5', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }, // Refresh
      { key: 'F12', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }, // DevTools
      { key: 'Tab', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }, // Tab navigation
      { key: 'Escape', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }, // Escape
      { key: 'w', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }, // Close tab
      { key: 't', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }, // New tab
      { key: 'r', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }, // Refresh
      { key: 'l', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }, // Address bar
    ];

    return browserShortcuts.some(
      (bs) =>
        bs.key === e.key &&
        bs.ctrlKey === e.ctrlKey &&
        bs.shiftKey === e.shiftKey &&
        bs.altKey === e.altKey &&
        bs.metaKey === e.metaKey
    );
  }

  /**
   * Get shortcut key string
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    return this.buildShortcutKey(
      shortcut.key,
      shortcut.ctrlKey,
      shortcut.shiftKey,
      shortcut.altKey,
      shortcut.metaKey
    );
  }

  /**
   * Build shortcut key string
   */
  private buildShortcutKey(
    key: string,
    ctrlKey?: boolean,
    shiftKey?: boolean,
    altKey?: boolean,
    metaKey?: boolean
  ): string {
    const parts: string[] = [];

    if (ctrlKey) parts.push('Ctrl');
    if (metaKey) parts.push('Meta');
    if (altKey) parts.push('Alt');
    if (shiftKey) parts.push('Shift');
    parts.push(key);

    return parts.join('+');
  }

  /**
   * Attach keydown handler
   */
  private attachHandler(): void {
    this.handler = (e: KeyboardEvent) => {
      this.handleKeyDown(e);
    };

    document.addEventListener('keydown', this.handler);
    logger?.debug?.('Attached keyboard shortcuts handler');
  }

  /**
   * Detach keydown handler
   */
  private detachHandler(): void {
    if (this.handler) {
      document.removeEventListener('keydown', this.handler);
      this.handler = null;
      logger?.debug?.('Detached keyboard shortcuts handler');
    }
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
    if (this.handler) {
      this.detachHandler();
    }
    logger?.debug?.('Cleared all keyboard shortcuts');
  }
}

/**
 * Global keyboard shortcuts registry
 */
const globalRegistry = new KeyboardShortcutsRegistry();

/**
 * Get global keyboard shortcuts registry
 */
export function getKeyboardShortcutsRegistry(): KeyboardShortcutsRegistry {
  return globalRegistry;
}

/**
 * Register a keyboard shortcut
 */
export function registerKeyboardShortcut(shortcut: KeyboardShortcut): void {
  globalRegistry.register(shortcut);
}

/**
 * Unregister a keyboard shortcut
 */
export function unregisterKeyboardShortcut(
  key: string,
  ctrlKey?: boolean,
  shiftKey?: boolean,
  altKey?: boolean,
  metaKey?: boolean
): void {
  globalRegistry.unregister(key, ctrlKey, shiftKey, altKey, metaKey);
}

/**
 * Get all registered shortcuts
 */
export function getKeyboardShortcuts(): readonly KeyboardShortcut[] {
  return globalRegistry.getShortcuts();
}

/**
 * Get shortcuts by context
 */
export function getKeyboardShortcutsByContext(context: string): readonly KeyboardShortcut[] {
  return globalRegistry.getShortcutsByContext(context);
}
