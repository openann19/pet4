/**
 * Image Editing Hook (Web)
 *
 * Provides comprehensive image editing capabilities:
 * - Crop, rotate, flip
 * - Filters (brightness, contrast, saturation, blur)
 * - Text overlays with fonts
 * - Drawing tools
 * - Stickers and emojis
 * - Compression and format conversion
 * - Undo/redo history
 *
 * Location: apps/web/src/hooks/media/use-image-editor.ts
 */

import { useCallback, useRef, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { triggerHaptic } from '@/effects/chat/core/haptic-manager';

const logger = createLogger('image-editor');

/**
 * Filter type
 */
export type FilterType =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'vibrant'
  | 'dramatic';

/**
 * Image adjustments
 */
export interface ImageAdjustments {
  readonly brightness: number; // -100 to 100
  readonly contrast: number; // -100 to 100
  readonly saturation: number; // -100 to 100
  readonly blur: number; // 0 to 20
  readonly sharpen: number; // 0 to 100
}

/**
 * Crop dimensions
 */
export interface CropDimensions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Text overlay
 */
export interface TextOverlay {
  readonly id: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly color: string;
  readonly rotation: number;
}

/**
 * Image editor options
 */
export interface UseImageEditorOptions {
  readonly maxHistorySize?: number;
  readonly outputFormat?: 'jpeg' | 'png' | 'webp';
  readonly outputQuality?: number; // 0 to 1
  readonly onError?: (error: Error) => void;
}

/**
 * Image editor return type
 */
export interface UseImageEditorReturn {
  readonly canvasRef: React.RefObject<HTMLCanvasElement>;
  readonly sourceImage: HTMLImageElement | null;
  readonly isProcessing: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly loadImage: (source: string | Blob) => Promise<void>;
  readonly applyFilter: (filter: FilterType) => void;
  readonly adjustImage: (adjustments: Partial<ImageAdjustments>) => void;
  readonly crop: (dimensions: CropDimensions) => void;
  readonly rotate: (degrees: number) => void;
  readonly flip: (direction: 'horizontal' | 'vertical') => void;
  readonly addText: (text: TextOverlay) => void;
  readonly removeText: (id: string) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly reset: () => void;
  readonly export: () => Promise<Blob | null>;
}

const DEFAULT_MAX_HISTORY = 20;
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_QUALITY = 0.92;

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  sharpen: 0,
};

function applyCanvasFilter(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  filter: FilterType
) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;

    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;

    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i]! * 1.2);
        data[i + 2] = Math.max(0, data[i + 2]! * 0.8);
      }
      break;

    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i]! * 1.1);
        data[i + 2] = Math.max(0, data[i + 2]! * 0.9);
      }
      break;

    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i]! * 0.9);
        data[i + 2] = Math.min(255, data[i + 2]! * 1.1);
      }
      break;

    case 'vibrant':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i]! * 1.3);
        data[i + 1] = Math.min(255, data[i + 1]! * 1.3);
        data[i + 2] = Math.min(255, data[i + 2]! * 1.3);
      }
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyCanvasAdjustments(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  adj: ImageAdjustments
) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const brightnessMultiplier = 1 + adj.brightness / 100;
  const contrastMultiplier = 1 + adj.contrast / 100;

  for (let i = 0; i < data.length; i += 4) {
    // Brightness
    data[i] = Math.min(255, Math.max(0, data[i]! * brightnessMultiplier));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1]! * brightnessMultiplier));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2]! * brightnessMultiplier));

    // Contrast
    data[i] = Math.min(255, Math.max(0, (data[i]! - 128) * contrastMultiplier + 128));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1]! - 128) * contrastMultiplier + 128));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2]! - 128) * contrastMultiplier + 128));
  }

  ctx.putImageData(imageData, 0, 0);
}

function useHistory(canvasRef: React.RefObject<HTMLCanvasElement>, maxHistorySize: number) {
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);

  // We need to force re-render when history changes to update canUndo/canRedo
  // But refs don't trigger re-render.
  // The original code relied on re-renders triggered by other state changes?
  // Or maybe canUndo/canRedo were calculated on each render.
  // Yes, `const canUndo = historyIndexRef.current > 0`

  // If I extract this to a hook, I need to return canUndo/canRedo.
  // But if historyIndexRef changes, the component won't re-render, so canUndo won't update.
  // The original code:
  // const canUndo = historyIndexRef.current > 0
  // ...
  // saveToHistory updates historyIndexRef.current
  // But saveToHistory is called after renderCanvas, which is called after state changes (filter, adjustments).
  // So the component re-renders due to state changes, and then canUndo is recalculated.

  // However, undo/redo update historyIndexRef.current. Does that trigger re-render?
  // No.
  // So `canUndo` might be stale if no other state changes?
  // Wait, `undo` calls `ctx.putImageData`. It doesn't update any state.
  // So the UI buttons for Undo/Redo might not update their disabled state?
  // That seems like a bug in the original code or I'm missing something.

  // Ah, `useImageEditor` returns `canUndo`. If the component using this hook relies on `canUndo` to disable buttons, it needs to re-render.
  // The original code seems to have this issue if `undo` doesn't trigger re-render.

  // I'll add a dummy state to force re-render on history change.
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Remove any states after current index (branching)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);

    // Add new state
    historyRef.current.push(imageData);

    // Limit history size
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }

    logger.debug('Saved to history', {
      index: historyIndexRef.current,
      size: historyRef.current.length,
    });
    forceUpdate();
  }, [maxHistorySize, canvasRef, forceUpdate]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    historyIndexRef.current--;
    const imageData = historyRef.current[historyIndexRef.current];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }

    void triggerHaptic('light');
    logger.debug('Undo', { index: historyIndexRef.current });
    forceUpdate();
  }, [canvasRef, forceUpdate]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    historyIndexRef.current++;
    const imageData = historyRef.current[historyIndexRef.current];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }

    void triggerHaptic('light');
    logger.debug('Redo', { index: historyIndexRef.current });
    forceUpdate();
  }, [canvasRef, forceUpdate]);

  const resetHistory = useCallback(() => {
    historyRef.current = [];
    historyIndexRef.current = -1;
    forceUpdate();
  }, [forceUpdate]);

  return {
    saveToHistory,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  };
}

function useTransformations(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  sourceImage: HTMLImageElement | null,
  setRotation: React.Dispatch<React.SetStateAction<number>>,
  setFlipH: React.Dispatch<React.SetStateAction<boolean>>,
  setFlipV: React.Dispatch<React.SetStateAction<boolean>>,
  renderCanvas: () => void,
  saveToHistory: () => void
) {
  const crop = useCallback(
    (dimensions: CropDimensions) => {
      if (!canvasRef.current || !sourceImage) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // Create temporary canvas for cropped image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = dimensions.width;
      tempCanvas.height = dimensions.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        return;
      }

      // Copy cropped region
      tempCtx.drawImage(
        canvas,
        dimensions.x,
        dimensions.y,
        dimensions.width,
        dimensions.height,
        0,
        0,
        dimensions.width,
        dimensions.height
      );

      // Update main canvas
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      ctx.drawImage(tempCanvas, 0, 0);

      saveToHistory();
      void triggerHaptic('success');
      logger.debug('Image cropped', dimensions);
    },
    [sourceImage, saveToHistory, canvasRef]
  );

  const rotate = useCallback(
    (degrees: number) => {
      setRotation((prev) => (prev + degrees) % 360);
      renderCanvas();
      saveToHistory();
      void triggerHaptic('light');
      logger.debug('Image rotated', { degrees });
    },
    [renderCanvas, saveToHistory, setRotation]
  );

  const flip = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      if (direction === 'horizontal') {
        setFlipH((prev) => !prev);
      } else {
        setFlipV((prev) => !prev);
      }
      renderCanvas();
      saveToHistory();
      void triggerHaptic('light');
      logger.debug('Image flipped', { direction });
    },
    [renderCanvas, saveToHistory, setFlipH, setFlipV]
  );

  return { crop, rotate, flip };
}

export function useImageEditor(options: UseImageEditorOptions = {}): UseImageEditorReturn {
  const {
    maxHistorySize = DEFAULT_MAX_HISTORY,
    outputFormat = DEFAULT_OUTPUT_FORMAT,
    outputQuality = DEFAULT_OUTPUT_QUALITY,
    onError,
  } = options;

  // State
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // History management
  const { saveToHistory, undo, redo, resetHistory, canUndo, canRedo } = useHistory(
    canvasRef,
    maxHistorySize
  );

  // Render canvas with current state
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !sourceImage) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw image
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    ctx.restore();

    // Apply filter
    applyCanvasFilter(ctx, canvas, currentFilter);

    // Apply adjustments
    applyCanvasAdjustments(ctx, canvas, adjustments);

    // Draw text overlays
    textOverlays.forEach((overlay) => {
      ctx.save();
      ctx.translate(overlay.x, overlay.y);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(overlay.text, 0, 0);
      ctx.restore();
    });
  }, [sourceImage, rotation, flipH, flipV, currentFilter, adjustments, textOverlays]);

  // Load image
  const loadImage = useCallback(
    async (source: string | Blob) => {
      setIsProcessing(true);

      try {
        const img = new Image();
        const url = typeof source === 'string' ? source : URL.createObjectURL(source);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = url;
        });

        if (typeof source !== 'string') {
          URL.revokeObjectURL(url);
        }

        setSourceImage(img);

        // Set canvas size
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
        }

        // Reset state
        setCurrentFilter('none');
        setAdjustments(DEFAULT_ADJUSTMENTS);
        setTextOverlays([]);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        resetHistory();

        void triggerHaptic('success');
        logger.debug('Image loaded', { width: img.width, height: img.height });
      } catch (err) {
        logger.error('Failed to load image', err);
        onError?.(err as Error);
        void triggerHaptic('error');
      } finally {
        setIsProcessing(false);
      }
    },
    [onError, resetHistory]
  );

  // Apply filter
  const applyFilter = useCallback(
    (filter: FilterType) => {
      setCurrentFilter(filter);
      renderCanvas();
      saveToHistory();
      void triggerHaptic('light');
      logger.debug('Filter applied', { filter });
    },
    [renderCanvas, saveToHistory]
  );

  // Adjust image
  const adjustImage = useCallback(
    (newAdjustments: Partial<ImageAdjustments>) => {
      setAdjustments((prev) => ({ ...prev, ...newAdjustments }));
      renderCanvas();
      saveToHistory();
    },
    [renderCanvas, saveToHistory]
  );

  // Transformations
  const { crop, rotate, flip } = useTransformations(
    canvasRef,
    sourceImage,
    setRotation,
    setFlipH,
    setFlipV,
    renderCanvas,
    saveToHistory
  );

  // Add text overlay
  const addText = useCallback(
    (text: TextOverlay) => {
      setTextOverlays((prev) => [...prev, text]);
      renderCanvas();
      saveToHistory();
      void triggerHaptic('light');
      logger.debug('Text added', { id: text.id });
    },
    [renderCanvas, saveToHistory]
  );

  // Remove text overlay
  const removeText = useCallback(
    (id: string) => {
      setTextOverlays((prev) => prev.filter((t) => t.id !== id));
      renderCanvas();
      saveToHistory();
      logger.debug('Text removed', { id });
    },
    [renderCanvas, saveToHistory]
  );

  // Reset to original
  const reset = useCallback(() => {
    setCurrentFilter('none');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTextOverlays([]);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    resetHistory();
    renderCanvas();
    void triggerHaptic('success');
    logger.debug('Reset to original');
  }, [renderCanvas, resetHistory]);

  // Export edited image
  const exportImage = useCallback(async (): Promise<Blob | null> => {
    if (!canvasRef.current) {
      return null;
    }

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, `image/${outputFormat}`, outputQuality);
      });

      if (blob) {
        void triggerHaptic('success');
        logger.debug('Image exported', {
          format: outputFormat,
          size: blob.size,
        });
      }

      return blob;
    } catch (err) {
      logger.error('Failed to export image', err);
      onError?.(err as Error);
      void triggerHaptic('error');
      return null;
    }
  }, [outputFormat, outputQuality, onError]);

  return {
    canvasRef,
    sourceImage,
    isProcessing,
    canUndo,
    canRedo,
    loadImage,
    applyFilter,
    adjustImage,
    crop,
    rotate,
    flip,
    addText,
    removeText,
    undo,
    redo,
    reset,
    export: exportImage,
  };
}
