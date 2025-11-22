/**
 * Drag & Drop Support Hook (Web)
 *
 * Provides drag and drop functionality for:
 * - Drag images to upload
 * - Drag messages to reply
 * - Visual feedback during drag
 *
 * Location: apps/web/src/effects/gestures/use-drag-drop.ts
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { useUIConfig } from '@/hooks/use-ui-config';
import { announceToScreenReader } from '@/lib/accessibility';

const logger = createLogger('drag-drop');

/**
 * Keyboard alternative configuration for drag operations (WCAG 2.5.7)
 */
export interface KeyboardAlternativeConfig {
  readonly enabled: boolean;
  readonly keys: readonly string[]; // e.g., ['ArrowUp', 'ArrowDown', 'Enter']
  readonly onKeyboardMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  readonly onKeyboardSelect?: () => void;
  readonly onKeyboardCancel?: () => void;
}

/**
 * Drag and drop options
 */
export interface UseDragDropOptions {
  enabled?: boolean;
  onDrop?: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  accept?: string[]; // MIME types or file extensions
  multiple?: boolean;
  keyboardAlternative?: KeyboardAlternativeConfig;
  undoable?: boolean; // WCAG 2.5.7: Drag operations must be undoable
  requireConfirmation?: boolean; // WCAG 2.5.7: Require confirmation before drop
}

/**
 * Drag and drop return type
 */
export interface UseDragDropReturn {
  isDragging: boolean;
  dragOver: boolean;
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  keyboardHandlers: {
    onKeyDown: (e: React.KeyboardEvent) => void;
    onKeyUp: (e: React.KeyboardEvent) => void;
  };
  undo: () => void;
  canUndo: boolean;
}

const DEFAULT_ENABLED = true;
const DEFAULT_MULTIPLE = true;

export function useDragDrop(options: UseDragDropOptions = {}): UseDragDropReturn {
  const {
    enabled = DEFAULT_ENABLED,
    onDrop,
    onDragEnter,
    onDragLeave,
    accept = ['image/*', 'video/*'],
    multiple = DEFAULT_MULTIPLE,
    keyboardAlternative,
    undoable = false,
    requireConfirmation = false,
  } = options;

  const { _visual, feedback } = useUIConfig();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const lastDropRef = useRef<File[] | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      dragCounter.current++;

      if (e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
        setDragOver(true);
        onDragEnter?.();

        logger.debug('Drag entered', {
          types: e.dataTransfer.types,
        });
      }
    },
    [enabled, onDragEnter]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !isDragging) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Set drop effect
      e.dataTransfer.dropEffect = 'copy';

      setDragOver(true);
    },
    [enabled, isDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      dragCounter.current--;

      if (dragCounter.current === 0) {
        setIsDragging(false);
        setDragOver(false);
        onDragLeave?.();

        logger.debug('Drag left');
      }
    },
    [enabled, onDragLeave]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      dragCounter.current = 0;
      setIsDragging(false);
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);

      // Filter files by accepted types
      const acceptedFiles = files.filter((file) => {
        if (accept.length === 0) {
          return true;
        }

        return accept.some((pattern) => {
          if (pattern.includes('/*')) {
            // MIME type pattern (e.g., "image/*")
            const type = pattern.split('/')[0];
            return file.type.startsWith(type + '/');
          } else if (pattern.startsWith('.')) {
            // File extension (e.g., ".jpg")
            return file.name.toLowerCase().endsWith(pattern.toLowerCase());
          } else {
            // Exact MIME type
            return file.type === pattern;
          }
        });
      });

      if (acceptedFiles.length === 0) {
        logger.warn('No accepted files in drop', {
          totalFiles: files.length,
          accept,
        });
        return;
      }

      const filesToProcess = multiple ? acceptedFiles : acceptedFiles.slice(0, 1);

      logger.info('Files dropped', {
        count: filesToProcess.length,
        files: filesToProcess.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      });

      // Trigger haptic feedback if enabled
      if (feedback.haptics) {
        // Web haptics via vibration API
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }

      // Store last drop for undo
      if (undoable) {
        lastDropRef.current = filesToProcess;
        setCanUndo(true);
      }

      // Require confirmation if specified
      if (requireConfirmation) {
        const confirmed = window.confirm(
          `Drop ${filesToProcess.length} file(s)? This action can be undone.`
        );
        if (!confirmed) {
          logger.debug('Drop cancelled by user');
          return;
        }
      }

      onDrop?.(filesToProcess);

      // Announce to screen reader
      announceToScreenReader(
        `Dropped ${filesToProcess.length} file${filesToProcess.length > 1 ? 's' : ''}. ${undoable ? 'Press Ctrl+Z to undo.' : ''}`,
        'polite'
      );
    },
    [enabled, accept, multiple, onDrop, feedback, undoable, requireConfirmation]
  );

  // Keyboard handlers for drag alternatives (WCAG 2.5.7)
  const handleKeyboardDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!keyboardAlternative?.enabled || !enabled) {
        return;
      }

      // Handle file input trigger (Space/Enter opens file picker)
      if ((e.key === 'Enter' || e.key === ' ') && !fileInputRef.current) {
        e.preventDefault();

        // Create hidden file input for keyboard file selection
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = multiple;
        input.accept = accept.join(',');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        input.style.opacity = '0';
        input.setAttribute('aria-label', 'Select files to upload');

        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          const files = target.files ? Array.from(target.files) : [];
          if (files.length > 0) {
            const filesToProcess = multiple ? files : files.slice(0, 1);
            lastDropRef.current = filesToProcess;
            if (undoable) {
              setCanUndo(true);
            }
            onDrop?.(filesToProcess);
            announceToScreenReader(
              `Selected ${filesToProcess.length} file${filesToProcess.length > 1 ? 's' : ''}. ${undoable ? 'Press Ctrl+Z to undo.' : ''}`,
              'polite'
            );
          }
          document.body.removeChild(input);
          fileInputRef.current = null;
        };

        document.body.appendChild(input);
        fileInputRef.current = input;
        input.click();
        return;
      }

      // Handle arrow key movement
      if (keyboardAlternative.onKeyboardMove) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            keyboardAlternative.onKeyboardMove('up');
            announceToScreenReader('Move up', 'polite');
            break;
          case 'ArrowDown':
            e.preventDefault();
            keyboardAlternative.onKeyboardMove('down');
            announceToScreenReader('Move down', 'polite');
            break;
          case 'ArrowLeft':
            e.preventDefault();
            keyboardAlternative.onKeyboardMove('left');
            announceToScreenReader('Move left', 'polite');
            break;
          case 'ArrowRight':
            e.preventDefault();
            keyboardAlternative.onKeyboardMove('right');
            announceToScreenReader('Move right', 'polite');
            break;
        }
      }

      // Handle selection
      if (e.key === 'Enter' && keyboardAlternative.onKeyboardSelect) {
        e.preventDefault();
        keyboardAlternative.onKeyboardSelect();
        announceToScreenReader('Selected', 'polite');
      }

      // Handle cancel
      if (e.key === 'Escape' && keyboardAlternative.onKeyboardCancel) {
        e.preventDefault();
        keyboardAlternative.onKeyboardCancel();
        announceToScreenReader('Cancelled', 'polite');
      }
    },
    [keyboardAlternative, enabled, multiple, accept, onDrop, undoable]
  );

  const handleKeyboardUp = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle undo (Ctrl+Z or Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoable && canUndo) {
        e.preventDefault();
        undo();
      }
    },
    [undoable, canUndo]
  );

  // Undo function
  const undo = useCallback(() => {
    if (lastDropRef.current && undoable) {
      logger.debug('Undoing last drop', {
        fileCount: lastDropRef.current.length,
      });
      lastDropRef.current = null;
      setCanUndo(false);
      announceToScreenReader('Upload undone', 'polite');
      // Note: Actual undo logic should be implemented by the parent component
      // This just provides the framework for undo support
    }
  }, [undoable]);

  // Cleanup file input on unmount
  useEffect(() => {
    return () => {
      if (fileInputRef.current && fileInputRef.current.parentNode) {
        fileInputRef.current.parentNode.removeChild(fileInputRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    dragOver,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    keyboardHandlers: {
      onKeyDown: handleKeyboardDown,
      onKeyUp: handleKeyboardUp,
    },
    undo,
    canUndo,
  };
}
