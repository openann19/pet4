/**
 * Keyboard Shortcuts Help Modal (WCAG 2.2 AAA)
 *
 * Displays keyboard shortcuts help modal for accessibility.
 *
 * Location: apps/web/src/components/a11y/KeyboardShortcutsHelp.tsx
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getKeyboardShortcuts, getKeyboardShortcutsByContext, type KeyboardShortcut } from '@/core/a11y/keyboard-shortcuts';
import { useEnhancedAnnouncements } from '@/hooks/use-enhanced-announcements';
import { X } from '@phosphor-icons/react';

/**
 * Keyboard shortcuts help modal props
 */
export interface KeyboardShortcutsHelpProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly context?: string;
}

/**
 * Format shortcut key for display
 */
function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  parts.push(shortcut.key);

  return parts.join(' + ');
}

/**
 * Group shortcuts by context
 */
function groupShortcutsByContext(shortcuts: readonly KeyboardShortcut[]): Map<string, KeyboardShortcut[]> {
  const grouped = new Map<string, KeyboardShortcut[]>();

  for (const shortcut of shortcuts) {
    const context = shortcut.context ?? 'General';
    if (!grouped.has(context)) {
      grouped.set(context, []);
    }
    grouped.get(context)!.push(shortcut);
  }

  return grouped;
}

/**
 * Keyboard shortcuts help modal
 */
export function KeyboardShortcutsHelp({ open, onClose, context }: KeyboardShortcutsHelpProps): JSX.Element {
  const [shortcuts, setShortcuts] = useState<readonly KeyboardShortcut[]>([]);
  const { announceNavigation } = useEnhancedAnnouncements();

  useEffect(() => {
    if (open) {
      const allShortcuts = context ? getKeyboardShortcutsByContext(context) : getKeyboardShortcuts();
      setShortcuts(allShortcuts);
      announceNavigation('Keyboard shortcuts help');
    }
  }, [open, context, announceNavigation]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleEscape]);

  if (!open) {
    return <></> as JSX.Element;
  }

  const groupedShortcuts = groupShortcutsByContext(shortcuts);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      aria-describedby="keyboard-shortcuts-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col focus-ring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 id="keyboard-shortcuts-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => void onClose()}
            aria-label="Close keyboard shortcuts help"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-ring"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Description */}
        <div id="keyboard-shortcuts-description" className="sr-only">
          List of available keyboard shortcuts. Press Escape to close this dialog.
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {shortcuts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No keyboard shortcuts available.</p>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedShortcuts.entries()).map(([ctx, ctxShortcuts]) => (
                <div key={ctx}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{ctx}</h3>
                  <div className="space-y-2">
                    {ctxShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                        <kbd className="px-3 py-1 text-sm font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white">
                          {formatShortcutKey(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd> to
            close this dialog.
          </p>
        </div>
      </div>
    </div>
  );
}
