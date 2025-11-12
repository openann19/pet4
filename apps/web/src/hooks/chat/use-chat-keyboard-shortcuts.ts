/**
 * Chat Keyboard Shortcuts Hook (WCAG 2.2 AAA)
 *
 * Provides keyboard shortcuts for common chat actions:
 * - Send message: Ctrl+Enter / Cmd+Enter
 * - Reply to message: R (when message focused)
 * - Delete message: Delete / Backspace (when message focused)
 * - React to message: : (opens reaction picker)
 * - Scroll to bottom: Ctrl+J / Cmd+J
 * - Focus input: Ctrl+K / Cmd+K
 * - Close chat: Escape (when chat open)
 *
 * Location: apps/web/src/hooks/chat/use-chat-keyboard-shortcuts.ts
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  registerKeyboardShortcut,
  unregisterKeyboardShortcut,
  type KeyboardShortcut,
} from '@/core/a11y/keyboard-shortcuts';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-chat-keyboard-shortcuts');

/**
 * Options for chat keyboard shortcuts hook
 */
export interface UseChatKeyboardShortcutsOptions {
  readonly enabled?: boolean;
  readonly context?: string;
  readonly onSend?: () => void;
  readonly onReply?: () => void;
  readonly onDelete?: () => void;
  readonly onReact?: () => void;
  readonly onScrollToBottom?: () => void;
  readonly onFocusInput?: () => void;
  readonly onClose?: () => void;
  readonly inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  readonly messageFocused?: boolean;
}

/**
 * Return type for chat keyboard shortcuts hook
 */
export interface UseChatKeyboardShortcutsReturn {
  readonly register: () => void;
  readonly unregister: () => void;
}

/**
 * Hook to register chat keyboard shortcuts
 */
export function useChatKeyboardShortcuts(
  options: UseChatKeyboardShortcutsOptions = {}
): UseChatKeyboardShortcutsReturn {
  const {
    enabled = true,
    context = 'chat',
    onSend,
    onReply,
    onDelete,
    onReact,
    onScrollToBottom,
    onFocusInput,
    onClose,
    inputRef,
    messageFocused = false,
  } = options;

  const shortcutsRef = useRef<string[]>([]);

  const register = useCallback(() => {
    if (!enabled) {
      return;
    }

    const shortcuts: KeyboardShortcut[] = [];

    // Send message: Ctrl+Enter / Cmd+Enter (or just Enter if not in input)
    if (onSend) {
      const sendShortcut: KeyboardShortcut = {
        key: 'Enter',
        ctrlKey: true,
        description: 'Send message',
        context,
        action: () => {
          onSend();
        },
        preventDefault: true,
      };
      registerKeyboardShortcut(sendShortcut);
      shortcuts.push(sendShortcut);
      shortcutsRef.current.push('Enter-Ctrl');
    }

    // Reply to message: R (when message focused)
    if (onReply && messageFocused) {
      const replyShortcut: KeyboardShortcut = {
        key: 'r',
        description: 'Reply to message',
        context,
        action: onReply,
        preventDefault: true,
      };
      registerKeyboardShortcut(replyShortcut);
      shortcuts.push(replyShortcut);
      shortcutsRef.current.push('r');
    }

    // Delete message: Delete / Backspace (when message focused)
    if (onDelete && messageFocused) {
      const deleteShortcut: KeyboardShortcut = {
        key: 'Delete',
        description: 'Delete message',
        context,
        action: onDelete,
        preventDefault: true,
      };
      registerKeyboardShortcut(deleteShortcut);
      shortcuts.push(deleteShortcut);
      shortcutsRef.current.push('Delete');

      const backspaceShortcut: KeyboardShortcut = {
        key: 'Backspace',
        description: 'Delete message',
        context,
        action: onDelete,
        preventDefault: true,
      };
      registerKeyboardShortcut(backspaceShortcut);
      shortcuts.push(backspaceShortcut);
      shortcutsRef.current.push('Backspace');
    }

    // React to message: : (opens reaction picker)
    if (onReact && messageFocused) {
      const reactShortcut: KeyboardShortcut = {
        key: ':',
        description: 'React to message',
        context,
        action: onReact,
        preventDefault: true,
      };
      registerKeyboardShortcut(reactShortcut);
      shortcuts.push(reactShortcut);
      shortcutsRef.current.push(':');
    }

    // Scroll to bottom: Ctrl+J / Cmd+J
    if (onScrollToBottom) {
      const scrollShortcut: KeyboardShortcut = {
        key: 'j',
        ctrlKey: true,
        description: 'Scroll to bottom',
        context,
        action: onScrollToBottom,
        preventDefault: true,
      };
      registerKeyboardShortcut(scrollShortcut);
      shortcuts.push(scrollShortcut);
      shortcutsRef.current.push('j-Ctrl');
    }

    // Focus input: Ctrl+K / Cmd+K
    if (onFocusInput || inputRef) {
      const focusShortcut: KeyboardShortcut = {
        key: 'k',
        ctrlKey: true,
        description: 'Focus chat input',
        context,
        action: () => {
          if (onFocusInput) {
            onFocusInput();
          } else if (inputRef?.current) {
            inputRef.current.focus();
          }
        },
        preventDefault: true,
      };
      registerKeyboardShortcut(focusShortcut);
      shortcuts.push(focusShortcut);
      shortcutsRef.current.push('k-Ctrl');
    }

    // Close chat: Escape (when chat open)
    if (onClose) {
      const closeShortcut: KeyboardShortcut = {
        key: 'Escape',
        description: 'Close chat',
        context,
        action: onClose,
        preventDefault: true,
      };
      registerKeyboardShortcut(closeShortcut);
      shortcuts.push(closeShortcut);
      shortcutsRef.current.push('Escape');
    }

    logger.debug('Registered chat keyboard shortcuts', {
      count: shortcuts.length,
      context,
    });
  }, [
    enabled,
    context,
    onSend,
    onReply,
    onDelete,
    onReact,
    onScrollToBottom,
    onFocusInput,
    onClose,
    inputRef,
    messageFocused,
  ]);

  const unregister = useCallback(() => {
    for (const shortcutKey of shortcutsRef.current) {
      if (shortcutKey) {
        const parts = shortcutKey.split('-');
        const key = parts[0];
        const modifier = parts[1];
        if (key) {
          if (modifier === 'Ctrl') {
            unregisterKeyboardShortcut(key, true);
          } else {
            unregisterKeyboardShortcut(key);
          }
        }
      }
    }
    shortcutsRef.current = [];
    logger.debug('Unregistered chat keyboard shortcuts', { context });
  }, [context]);

  // Register shortcuts on mount, unregister on unmount
  useEffect(() => {
    if (enabled) {
      register();
    }

    return () => {
      unregister();
    };
  }, [enabled, register, unregister]);

  return {
    register,
    unregister,
  };
}
