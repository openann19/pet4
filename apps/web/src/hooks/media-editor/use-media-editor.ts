import { useState, useRef, useCallback } from 'react';
import { useMediaProcessor } from './use-media-processor';
import { useBackgroundRemoval } from './use-background-removal';
import { useFilters } from './use-filters';
import { useVideoTimeline } from './use-video-timeline';
import { useSmartResize } from './use-smart-resize';
import { useUndoRedo, useKeyboardShortcuts } from './use-editor-ui';
import { useMediaLoader } from './use-media-loader';
import { useEditingOperations } from './use-editing-operations';
import { usePresets } from './use-presets';

/**
 * Main media editor orchestrator
 * Integrates all editor features with unified state management
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MediaEditorOptions {
  readonly context: 'post' | 'profile' | 'message' | 'story';
  readonly maxDuration?: number;
  readonly maxFileSize?: number;
  readonly allowedFormats?: readonly string[];
  readonly aspectRatio?: number;
  readonly quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export interface EditorState {
  readonly originalMedia: HTMLImageElement | HTMLVideoElement | null;
  readonly currentMedia: HTMLCanvasElement | null;
  readonly mediaType: 'image' | 'video' | null;
  readonly filters: readonly string[];
  readonly adjustments: Record<string, number>;
  readonly cropRegion: CropRegion | null;
  readonly backgroundRemoved: boolean;
  readonly aspectRatio: number | null;
}

export interface CropRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface EditorPreset {
  readonly id: string;
  readonly name: string;
  readonly context: MediaEditorOptions['context'];
  readonly aspectRatio?: number;
  readonly filters?: readonly string[];
  readonly adjustments?: Record<string, number>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMediaEditor(options: MediaEditorOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialState: EditorState = {
    originalMedia: null,
    currentMedia: null,
    mediaType: null,
    filters: [],
    adjustments: {},
    cropRegion: null,
    backgroundRemoved: false,
    aspectRatio: options.aspectRatio ?? null,
  };

  const {
    state: editorState,
    set: setEditorState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<EditorState>(initialState);

  // Initialize all editor hooks
  const mediaProcessor = useMediaProcessor();
  const backgroundRemoval = useBackgroundRemoval();
  const filters = useFilters();
  const timeline = useVideoTimeline();
  const smartResize = useSmartResize();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const { loadImage, loadVideo } = useMediaLoader({
    editorState,
    setEditorState,
    setIsProcessing,
    setError,
    setIsReady,
  });

  const { applyFilter, removeBackground, cropToAspectRatio, applyAdjustment } =
    useEditingOperations({
      editorState,
      setEditorState,
      setIsProcessing,
      setError,
      quality: options.quality,
    });

  const { applyPreset, getPresetsForContext } = usePresets({
    options,
    editorState,
    cropToAspectRatio,
    applyFilter,
    applyAdjustment,
    setIsProcessing,
    setError,
  });

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  useKeyboardShortcuts([
    {
      key: 'z',
      modifiers: ['ctrl'],
      action: undo,
      description: 'Undo',
    },
    {
      key: 'y',
      modifiers: ['ctrl'],
      action: redo,
      description: 'Redo',
    },
    {
      key: 's',
      modifiers: ['ctrl'],
      action: () => {
        void exportMedia();
      },
      description: 'Save/Export',
    },
    {
      key: 'Escape',
      action: () => reset(),
      description: 'Reset',
    },
  ]);

  // ============================================================================
  // Export
  // ============================================================================

  const exportMedia = useCallback(async (): Promise<Blob | null> => {
    if (!editorState.currentMedia) return null;

    try {
      setIsProcessing(true);

      const blob = await mediaProcessor.canvasToBlob(editorState.currentMedia, {
        quality: options.quality ?? 'high',
        format: 'webp',
        compression: 0.92,
        preserveAlpha: editorState.backgroundRemoved,
      });

      setIsProcessing(false);
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export';
      setError(message);
      setIsProcessing(false);
      return null;
    }
  }, [editorState.currentMedia, editorState.backgroundRemoved, mediaProcessor, options.quality]);

  // ============================================================================
  // Reset
  // ============================================================================

  const reset = useCallback(() => {
    if (editorState.originalMedia) {
      const canvas = document.createElement('canvas');
      const media = editorState.originalMedia;
      canvas.width = 'naturalWidth' in media ? media.naturalWidth : media.videoWidth;
      canvas.height = 'naturalHeight' in media ? media.naturalHeight : media.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(media, 0, 0);
      }

      setEditorState({
        ...initialState,
        originalMedia: editorState.originalMedia,
        currentMedia: canvas,
        mediaType: editorState.mediaType,
      });
    }
  }, [editorState.originalMedia, editorState.mediaType, setEditorState, initialState]);

  return {
    // State
    isReady,
    isProcessing,
    error,
    editorState,

    // History
    undo,
    redo,
    canUndo,
    canRedo,

    // Loading
    loadImage,
    loadVideo,

    // Editing
    applyFilter,
    removeBackground,
    cropToAspectRatio,
    applyAdjustment,

    // Presets
    applyPreset,
    getPresetsForContext,

    // Export
    exportMedia,
    reset,

    // Sub-modules
    mediaProcessor,
    backgroundRemoval,
    filters,
    timeline,
    smartResize,

    // Refs
    canvasRef,
    previewRef,
  };
}
