/**
 * Keyboard Shortcuts Tests
 *
 * Tests for keyboard shortcuts registry.
 *
 * Location: apps/web/src/core/a11y/__tests__/keyboard-shortcuts.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyboardShortcutsRegistry,
  registerKeyboardShortcut,
  unregisterKeyboardShortcut,
  getKeyboardShortcuts,
  getKeyboardShortcutsByContext,
  getKeyboardShortcutsRegistry,
  type KeyboardShortcut,
} from '../keyboard-shortcuts';

describe('Keyboard Shortcuts Registry', () => {
  let registry: KeyboardShortcutsRegistry;
  let actionSpy: () => void;

  beforeEach(() => {
    registry = new KeyboardShortcutsRegistry();
    actionSpy = vi.fn(() => {}) as () => void;
  });

  afterEach(() => {
    registry.clear();
  });

  it('should register a keyboard shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 'k',
      ctrlKey: true,
      description: 'Test shortcut',
      action: actionSpy,
    };

    registry.register(shortcut);

    const shortcuts = registry.getShortcuts();
    expect(shortcuts).toHaveLength(1);
    expect(shortcuts[0]).toEqual(shortcut);
  });

  it('should unregister a keyboard shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 'k',
      ctrlKey: true,
      description: 'Test shortcut',
      action: actionSpy,
    };

    registry.register(shortcut);
    registry.unregister('k', true);

    const shortcuts = registry.getShortcuts();
    expect(shortcuts).toHaveLength(0);
  });

  it('should handle keydown event', () => {
    const shortcut: KeyboardShortcut = {
      key: 'k',
      ctrlKey: true,
      description: 'Test shortcut',
      action: actionSpy,
    };

    registry.register(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    registry.handleKeyDown(event);

    expect(actionSpy).toHaveBeenCalled();
  });

  it('should not handle keydown event if shortcuts are disabled', () => {
    const shortcut: KeyboardShortcut = {
      key: 'k',
      ctrlKey: true,
      description: 'Test shortcut',
      action: actionSpy,
    };

    registry.register(shortcut);
    registry.setEnabled(false);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    registry.handleKeyDown(event);

    expect(actionSpy).not.toHaveBeenCalled();
  });

  it('should get shortcuts by context', () => {
    const shortcut1: KeyboardShortcut = {
      key: 'k',
      ctrlKey: true,
      description: 'Test shortcut 1',
      action: actionSpy,
      context: 'chat',
    };

    const shortcut2: KeyboardShortcut = {
      key: 'j',
      ctrlKey: true,
      description: 'Test shortcut 2',
      action: actionSpy,
      context: 'general',
    };

    registry.register(shortcut1);
    registry.register(shortcut2);

    const chatShortcuts = registry.getShortcutsByContext('chat');
    expect(chatShortcuts).toHaveLength(1);
    expect(chatShortcuts[0]).toEqual(shortcut1);
  });

  it('should not conflict with browser shortcuts', () => {
    const shortcut: KeyboardShortcut = {
      key: 'w',
      ctrlKey: true,
      description: 'Test shortcut',
      action: actionSpy,
    };

    registry.register(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'w',
      ctrlKey: true,
      bubbles: true,
    });

    registry.handleKeyDown(event);

    // Should not execute because it conflicts with browser shortcut
    expect(actionSpy).not.toHaveBeenCalled();
  });

  it('should use global registry', () => {
    const shortcut: KeyboardShortcut = {
      key: 'k',
      ctrlKey: true,
      description: 'Test shortcut',
      action: actionSpy,
    };

    registerKeyboardShortcut(shortcut);

    const shortcuts = getKeyboardShortcuts();
    expect(shortcuts.length).toBeGreaterThan(0);

    unregisterKeyboardShortcut('k', true);
  });
});
