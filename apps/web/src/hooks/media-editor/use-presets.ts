import { useCallback } from 'react';
import type { MediaEditorOptions, EditorPreset, EditorState } from './use-media-editor';

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

interface UsePresetsProps {
  readonly options: MediaEditorOptions;
  readonly editorState: EditorState;
  readonly cropToAspectRatio: (aspectRatio: number) => Promise<void>;
  readonly applyFilter: (filterId: string) => Promise<void>;
  readonly applyAdjustment: (key: string, value: number) => void;
  readonly setIsProcessing: (isProcessing: boolean) => void;
  readonly setError: (error: string | null) => void;
}

export function usePresets({
  options,
  cropToAspectRatio,
  applyFilter,
  applyAdjustment,
  setIsProcessing,
  setError,
}: UsePresetsProps) {
  const applyPreset = useCallback(
    async (presetId: string): Promise<void> => {
      const contextPresets = CONTEXT_PRESETS[options.context];
      const preset = contextPresets.find((p) => p.id === presetId);

      if (!preset) {
        throw new Error(`Preset not found: ${presetId}`);
      }

      try {
        setIsProcessing(true);

        // Apply aspect ratio if specified
        if (preset.aspectRatio) {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to apply preset';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [options.context, cropToAspectRatio, applyFilter, applyAdjustment, setIsProcessing, setError]
  );

  const getPresetsForContext = useCallback(() => {
    return CONTEXT_PRESETS[options.context];
  }, [options.context]);

  return { applyPreset, getPresetsForContext };
}
