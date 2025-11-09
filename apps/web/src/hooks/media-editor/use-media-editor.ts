import { useCallback, useState, useRef, useEffect } from 'react';
import { useMediaProcessor } from './use-media-processor';
import { useBackgroundRemoval } from './use-background-removal';
import { useFilters } from './use-filters';
import { useVideoTimeline } from './use-video-timeline';
import { useSmartResize } from './use-smart-resize';
import { useUndoRedo, useKeyboardShortcuts } from './use-editor-ui';

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
// Context-Specific Presets
// ============================================================================

const CONTEXT_PRESETS: Record<MediaEditorOptions['context'], readonly EditorPreset[]> = {
  post: [
    {
      id: 'post-default',
      name: 'Default Post',
      context: 'post',
      aspectRatio: 1,
    },
    {
      id: 'post-landscape',
      name: 'Landscape Post',
      context: 'post',
      aspectRatio: 16 / 9,
    },
    {
      id: 'post-portrait',
      name: 'Portrait Post',
      context: 'post',
      aspectRatio: 4 / 5,
    },
    {
      id: 'post-vibrant',
      name: 'Vibrant Post',
      context: 'post',
      aspectRatio: 1,
      filters: ['vibrant-pop'],
    },
  ],
  profile: [
    {
      id: 'profile-photo',
      name: 'Profile Photo',
      context: 'profile',
      aspectRatio: 1,
      filters: ['portrait-natural'],
    },
    {
      id: 'profile-professional',
      name: 'Professional',
      context: 'profile',
      aspectRatio: 1,
      filters: ['portrait-magazine'],
    },
  ],
  message: [
    {
      id: 'message-quick',
      name: 'Quick Share',
      context: 'message',
      filters: ['natural'],
    },
    {
      id: 'message-fun',
      name: 'Fun Filter',
      context: 'message',
      filters: ['vibrant-pop'],
    },
  ],
  story: [
    {
      id: 'story-default',
      name: 'Story',
      context: 'story',
      aspectRatio: 9 / 16,
    },
    {
      id: 'story-dramatic',
      name: 'Dramatic Story',
      context: 'story',
      aspectRatio: 9 / 16,
      filters: ['dramatic-storm'],
    },
    {
      id: 'story-golden',
      name: 'Golden Hour',
      context: 'story',
      aspectRatio: 9 / 16,
      filters: ['cinematic-golden-hour'],
    },
  ],
};

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
      action: () => exportMedia(),
      description: 'Save/Export',
    },
    {
      key: 'Escape',
      action: () => reset(),
      description: 'Reset',
    },
  ]);

  // ============================================================================
  // Media Loading
  // ============================================================================

  const loadImage = useCallback(async (file: File | string): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      const url = typeof file === 'string' ? file : URL.createObjectURL(file);
      const img = await mediaProcessor.loadImage(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      setEditorState({
        ...editorState,
        originalMedia: img,
        currentMedia: canvas,
        mediaType: 'image',
      });

      setIsReady(true);
      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load image';
      setError(message);
      setIsProcessing(false);
      throw err;
    }
  }, [editorState, setEditorState, mediaProcessor]);

  const loadVideo = useCallback(async (file: File | string): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      const url = typeof file === 'string' ? file : URL.createObjectURL(file);
      const video = await mediaProcessor.loadVideo(url);

      // Extract first frame as preview
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }

      setEditorState({
        ...editorState,
        originalMedia: video,
        currentMedia: canvas,
        mediaType: 'video',
      });

      setIsReady(true);
      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load video';
      setError(message);
      setIsProcessing(false);
      throw err;
    }
  }, [editorState, setEditorState, mediaProcessor]);

  // ============================================================================
  // Editing Operations
  // ============================================================================

  const applyFilter = useCallback(async (filterId: string): Promise<void> => {
    if (!editorState.currentMedia) return;

    try {
      setIsProcessing(true);
      const preset = filters.getPresetById(filterId);

      if (!preset) {
        throw new Error(`Filter not found: ${filterId}`);
      }

      const result = await filters.applyFilter(editorState.currentMedia, preset);

      setEditorState({
        ...editorState,
        currentMedia: result,
        filters: [...editorState.filters, filterId],
      });

      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply filter';
      setError(message);
      setIsProcessing(false);
    }
  }, [editorState, setEditorState, filters]);

  const removeBackground = useCallback(async (): Promise<void> => {
    if (!editorState.currentMedia) return;

    try {
      setIsProcessing(true);

      const result = await backgroundRemoval.removeBackground(
        editorState.currentMedia,
        {
          quality: 'balanced',
          threshold: 0.5,
          feather: 5,
          refinement: true,
          preserveDetails: true,
          removeGreen: false,
        }
      );

      const canvas = document.createElement('canvas');
      canvas.width = result.width;
      canvas.height = result.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.putImageData(result, 0, 0);
      }

      setEditorState({
        ...editorState,
        currentMedia: canvas,
        backgroundRemoved: true,
      });

      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove background';
      setError(message);
      setIsProcessing(false);
    }
  }, [editorState, setEditorState, backgroundRemoval, options.quality]);

  const cropToAspectRatio = useCallback(async (aspectRatio: number): Promise<void> => {
    if (!editorState.currentMedia) return;

    try {
      setIsProcessing(true);

      const result = await smartResize.smartCrop(editorState.currentMedia, aspectRatio);

      setEditorState({
        ...editorState,
        currentMedia: result,
        aspectRatio,
      });

      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to crop';
      setError(message);
      setIsProcessing(false);
    }
  }, [editorState, setEditorState, smartResize]);

  const applyAdjustment = useCallback((key: string, value: number): void => {
    setEditorState({
      ...editorState,
      adjustments: {
        ...editorState.adjustments,
        [key]: value,
      },
    });
  }, [editorState, setEditorState]);

  // ============================================================================
  // Presets
  // ============================================================================

  const applyPreset = useCallback(async (presetId: string): Promise<void> => {
    const contextPresets = CONTEXT_PRESETS[options.context];
    const preset = contextPresets.find(p => p.id === presetId);

    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    try {
      setIsProcessing(true);

      // Apply aspect ratio if specified
      if (preset.aspectRatio && editorState.currentMedia) {
        await cropToAspectRatio(preset.aspectRatio);
      }

      // Apply filters if specified
      if (preset.filters && preset.filters.length > 0) {
        for (const filterId of preset.filters) {
          await applyFilter(filterId);
        }
      }

      // Apply adjustments if specified
      if (preset.adjustments) {
        Object.entries(preset.adjustments).forEach(([key, value]) => {
          applyAdjustment(key, value);
        });
      }

      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply preset';
      setError(message);
      setIsProcessing(false);
    }
  }, [options.context, editorState.currentMedia, cropToAspectRatio, applyFilter, applyAdjustment]);

  const getPresetsForContext = useCallback(() => {
    return CONTEXT_PRESETS[options.context];
  }, [options.context]);

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
    if (editorState.originalMedia && editorState.currentMedia) {
      const canvas = document.createElement('canvas');
      canvas.width = editorState.originalMedia.width;
      canvas.height = editorState.originalMedia.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(editorState.originalMedia, 0, 0);
      }

      setEditorState({
        ...initialState,
        originalMedia: editorState.originalMedia,
        currentMedia: canvas,
        mediaType: editorState.mediaType,
      });
    }
  }, [editorState.originalMedia, editorState.currentMedia, editorState.mediaType, setEditorState]);

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
