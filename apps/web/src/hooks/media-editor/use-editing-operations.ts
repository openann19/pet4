import { useCallback } from 'react';
import type { EditorState } from './use-media-editor';
import { useBackgroundRemoval } from './use-background-removal';
import { useFilters } from './use-filters';
import { useSmartResize } from './use-smart-resize';

interface UseEditingOperationsProps {
  readonly editorState: EditorState;
  readonly setEditorState: (state: EditorState) => void;
  readonly setIsProcessing: (isProcessing: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly quality: 'low' | 'medium' | 'high' | 'ultra' | undefined;
}

export function useEditingOperations({
  editorState,
  setEditorState,
  setIsProcessing,
  setError,
  quality,
}: UseEditingOperationsProps) {
  const backgroundRemoval = useBackgroundRemoval();
  const filters = useFilters();
  const smartResize = useSmartResize();

  const applyFilter = useCallback(
    async (filterId: string): Promise<void> => {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to apply filter';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [editorState, setEditorState, filters, setIsProcessing, setError]
  );

  const removeBackground = useCallback(async (): Promise<void> => {
    if (!editorState.currentMedia) return;

    try {
      setIsProcessing(true);

      const result = await backgroundRemoval.removeBackground(editorState.currentMedia, {
        quality: 'balanced',
        threshold: 0.5,
        feather: 5,
        refinement: true,
        preserveDetails: true,
        removeGreen: false,
      });

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove background';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [editorState, setEditorState, backgroundRemoval, quality]);

  const cropToAspectRatio = useCallback(
    async (aspectRatio: number): Promise<void> => {
      if (!editorState.currentMedia) return;

      try {
        setIsProcessing(true);

        const result = await smartResize.smartCrop(editorState.currentMedia, aspectRatio);

        setEditorState({
          ...editorState,
          currentMedia: result,
          aspectRatio,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to crop';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [editorState, setEditorState, smartResize]
  );

  const applyAdjustment = useCallback(
    (key: string, value: number): void => {
      setEditorState({
        ...editorState,
        adjustments: {
          ...editorState.adjustments,
          [key]: value,
        },
      });
    },
    [editorState, setEditorState]
  );

  return { applyFilter, removeBackground, cropToAspectRatio, applyAdjustment };
}
