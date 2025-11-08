'use client';

import { editMedia } from '@/core/services/media/edit-media';
import type { FilterName, ImageOperation, MediaInput } from '@/core/types/media-types';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { createLogger } from '@/lib/logger';
import React, { useCallback, useMemo, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const logger = createLogger('MediaEditor');

const FILTERS: FilterName[] = ['none', 'mono', 'sepia', 'vivid', 'cool', 'warm', 'cinematic'];

export interface MediaEditorProps {
  source: MediaInput & { type: 'image' };
  onDone: (uri: string) => void;
  onCancel?: () => void;
}

const isWeb = typeof window !== 'undefined';

export function MediaEditor({ source, onDone, onCancel }: MediaEditorProps): React.ReactElement {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const [filter, setFilter] = useState<FilterName>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const panZoom = useMemo(() => {
    return Gesture.Simultaneous(
      Gesture.Pan().onChange((e) => {
        tx.value += e.changeX;
        ty.value += e.changeY;
      }),
      Gesture.Pinch().onChange((e) => {
        scale.value *= e.scaleChange;
      })
    );
  }, [scale, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

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
      style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000' }}
    >
      <GestureDetector gesture={panZoom}>
        <AnimatedView style={animatedStyle}>
          {isWeb ? (
            <img
              src={source.uri}
              alt="Media preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
              }}
            />
          )}
        </AnimatedView>
      </GestureDetector>

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
    <AnimatedView
      onClick={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active ? '#08f' : '#222',
        cursor: 'pointer',
      }}
    >
      <Animated.Text
        style={{
          color: active ? '#fff' : '#aaa',
          fontSize: 12,
          fontWeight: active ? '600' : '400',
        }}
      >
        {label}
      </Animated.Text>
    </AnimatedView>
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
  const textColor = variant === 'primary' && !disabled ? '#000' : '#fff';

  const handleClick = disabled ? undefined : onPress;
  const styleProps: {
    paddingHorizontal: number;
    paddingVertical: number;
    borderRadius: number;
    backgroundColor: string;
    cursor: string;
    opacity: number;
    onClick?: () => void;
  } = {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
  if (handleClick !== undefined) {
    styleProps.onClick = handleClick;
  }

  return (
    <AnimatedView
      {...(handleClick !== undefined ? { onClick: handleClick } : {})}
      style={styleProps}
    >
      <Animated.Text
        style={{
          color: textColor,
          fontWeight: '600',
          fontSize: 14,
        }}
      >
        {label}
      </Animated.Text>
    </AnimatedView>
  );
}
