'use client';

import { editMedia } from '@/core/services/media/edit-media';
import type { FilterName, ImageOperation, MediaInput } from '@/core/types/media-types';
import { createLogger } from '@/lib/logger';
import React, { useCallback, useState } from 'react';

const logger = createLogger('MediaEditor');

const FILTERS: FilterName[] = ['none', 'mono', 'sepia', 'vivid', 'cool', 'warm', 'cinematic'];

export interface MediaEditorProps {
  source: MediaInput & { type: 'image' };
  onDone: (uri: string) => void;
  onCancel?: () => void;
}

export function MediaEditor({ source, onDone, onCancel }: MediaEditorProps): React.ReactElement {
  const [filter, setFilter] = useState<FilterName>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });

  const handleExport = useCallback(async (): Promise<void> => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      const ops: ImageOperation[] = [
        { type: 'filter', name: filter, intensity: 1 },
        { type: 'adjust', contrast: 0.1 },
      ];

      const mediaInput: MediaInput = {
        type: 'image',
        uri: source.uri,
      };
      if (source.width !== undefined) {
        mediaInput.width = source.width;
      }
      if (source.height !== undefined) {
        mediaInput.height = source.height;
      }
      const result = await editMedia(mediaInput, ops);

      onDone(result.uri);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Export failed', err, { sourceUri: source.uri });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [filter, source, onDone, isProcessing]);

  const handleCancel = useCallback((): void => {
    onCancel?.();
  }, [onCancel]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-fg)' }}
    >
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={source.uri}
          alt="Media preview"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: 'transform 0.1s ease-out',
          }}
          draggable={false}
        />
      </div>

      <div
        style={{
          padding: 12,
          backgroundColor: '#111',
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {FILTERS.map((f) => (
          <ToolChip key={f} active={f === filter} onPress={() => setFilter(f)} label={f} />
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'row', gap: 8 }}>
          {onCancel !== undefined && (
            <ToolButton onPress={handleCancel} label="Cancel" variant="secondary" />
          )}
          <ToolButton
            onPress={handleExport}
            label={isProcessing ? 'Processing...' : 'Save'}
            variant="primary"
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}

interface ToolChipProps {
  active: boolean;
  onPress: () => void;
  label: string;
}

function ToolChip({ active, onPress, label }: ToolChipProps): React.ReactElement {
  return (
    <button
      onClick={() => void onPress()}
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        backgroundColor: active ? '#08f' : '#222',
        cursor: 'pointer',
        border: 'none',
        color: active ? 'var(--color-bg-overlay)' : '#aaa',
        fontSize: 12,
        fontWeight: active ? '600' : '400',
      }}
    >
      {label}
    </button>
  );
}

interface ToolButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function ToolButton({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
}: ToolButtonProps): React.ReactElement {
  const backgroundColor = disabled ? '#666' : variant === 'primary' ? '#0af' : '#444';
  const textColor = variant === 'primary' && !disabled ? 'var(--color-fg)' : 'var(--color-bg-overlay)';

  return (
    <button
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        padding: '8px 14px',
        borderRadius: 12,
        backgroundColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: 'none',
        color: textColor,
        fontWeight: '600',
        fontSize: 14,
      }}
    >
      {label}
    </button>
  );
}
