import { useCallback } from 'react';
import type { EditorState } from './use-media-editor';
import { useMediaProcessor } from './use-media-processor';

interface UseMediaLoaderProps {
  readonly setEditorState: (state: EditorState) => void;
  readonly editorState: EditorState;
  readonly setIsProcessing: (isProcessing: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly setIsReady: (isReady: boolean) => void;
}

export function useMediaLoader({
  setEditorState,
  editorState,
  setIsProcessing,
  setError,
  setIsReady,
}: UseMediaLoaderProps) {
  const mediaProcessor = useMediaProcessor();

  const loadImage = useCallback(
    async (file: File | string): Promise<void> => {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load image';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [editorState, setEditorState, mediaProcessor, setIsProcessing, setError, setIsReady]
  );

  const loadVideo = useCallback(
    async (file: File | string): Promise<void> => {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load video';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [editorState, setEditorState, mediaProcessor, setIsProcessing, setError, setIsReady]
  );

  return { loadImage, loadVideo };
}
