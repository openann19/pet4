/**
 * Keyboard Shortcuts Component
 *
 * Displays keyboard shortcuts in a help modal or overlay.
 * Supports both visual display and screen reader announcements.
 */

import { useMemo } from 'react';
import { keyboardShortcuts } from '@/hooks/accessibility/use-keyboard-navigation';

export interface KeyboardShortcutItem {
    keys: string[];
    description: string;
    category?: string;
}

export interface KeyboardShortcutsProps {
    shortcuts?: KeyboardShortcutItem[];
    className?: string;
    showCategories?: boolean;
}

/**
 * Format keyboard shortcut for display
 */
function formatShortcut(keys: string[]): string {
    return keys
        .map((key) => {
            switch (key.toLowerCase()) {
                case 'ctrl':
                    return 'Ctrl';
                case 'meta':
                case 'cmd':
                    return '⌘';
                case 'shift':
                    return 'Shift';
                case 'alt':
                    return 'Alt';
                case ' ':
                    return 'Space';
                case 'arrowup':
                    return '↑';
                case 'arrowdown':
                    return '↓';
                case 'arrowleft':
                    return '←';
                case 'arrowright':
                    return '→';
                case 'escape':
                    return 'Esc';
                case 'enter':
                    return 'Enter';
                case 'backspace':
                    return 'Backspace';
                case 'delete':
                    return 'Delete';
                case 'tab':
                    return 'Tab';
                default:
                    return key.toUpperCase();
            }
        })
        .join(' + ');
}

/**
 * Parse shortcut string into keys array
 */
function parseShortcut(shortcut: string): string[] {
    return shortcut.split('+').map((key) => key.trim());
}

/**
 * Default keyboard shortcuts
 */
const defaultShortcuts: KeyboardShortcutItem[] = [
    {
        keys: parseShortcut(keyboardShortcuts.focusInput),
        description: 'Focus search/input',
        category: 'Navigation',
    },
    {
        keys: parseShortcut(keyboardShortcuts.toggleHelp),
        description: 'Toggle help',
        category: 'Navigation',
    },
    {
        keys: parseShortcut(keyboardShortcuts.closeModal),
        description: 'Close modal/cancel',
        category: 'Navigation',
    },
    {
        keys: parseShortcut(keyboardShortcuts.submit),
        description: 'Submit form',
        category: 'Actions',
    },
    {
        keys: parseShortcut(keyboardShortcuts.generate),
        description: 'Generate content',
        category: 'Actions',
    },
    {
        keys: parseShortcut(keyboardShortcuts.save),
        description: 'Save',
        category: 'Actions',
    },
    {
        keys: parseShortcut(keyboardShortcuts.next),
        description: 'Next item',
        category: 'Movement',
    },
    {
        keys: parseShortcut(keyboardShortcuts.previous),
        description: 'Previous item',
        category: 'Movement',
    },
    {
        keys: parseShortcut(keyboardShortcuts.nextTab),
        description: 'Next tab',
        category: 'Movement',
    },
    {
        keys: parseShortcut(keyboardShortcuts.previousTab),
        description: 'Previous tab',
        category: 'Movement',
    },
];

/**
 * Keyboard Shortcuts Component
 *
 * @example
 * ```tsx
 * <KeyboardShortcuts
 *   shortcuts={customShortcuts}
 *   showCategories={true}
 * />
 * ```
 */
export function KeyboardShortcuts({
    shortcuts = defaultShortcuts,
    className = '',
    showCategories = true,
}: KeyboardShortcutsProps): JSX.Element {
    const groupedShortcuts = useMemo(() => {
        if (!showCategories) {
            return { All: shortcuts };
        }

        return shortcuts.reduce(
            (acc, shortcut) => {
                const category = shortcut.category ?? 'Other';
                acc[category] ??= [];
                acc[category].push(shortcut);
                return acc;
            },
            {} as Record<string, KeyboardShortcutItem[]>
        );
    }, [shortcuts, showCategories]);

    return (
        <div className={`keyboard-shortcuts ${className}`}>
            <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>

            <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                        {showCategories && (
                            <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
                        )}

                        <dl className="space-y-2">
                            {items.map((shortcut, index) => (
                                <div
                                    key={`${category}-${index}`}
                                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                                >
                                    <dt className="text-sm text-foreground">{shortcut.description}</dt>
                                    <dd className="flex items-center gap-1">
                                        {shortcut.keys.map((key, keyIndex) => (
                                            <kbd
                                                key={keyIndex}
                                                className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                                            >
                                                {formatShortcut([key])}
                                            </kbd>
                                        ))}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
        </div>
    );
}
