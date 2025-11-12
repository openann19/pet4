'use client';

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { X, Trash } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  messagePreview?: string;
  context?: 'self-delete' | 'admin-delete';
  className?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  messagePreview,
  context = 'self-delete',
  className,
}: DeleteConfirmationModalProps) {
  const _uiConfig = useUIConfig();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const modalStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleConfirm = useCallback(() => {
    haptics.impact('medium');
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    haptics.selection();
    onCancel();
  }, [onCancel]);

  if (!isOpen) {
    scale.value = 0;
    opacity.value = 0;
    backdropOpacity.value = 0;
    return null;
  }

  scale.value = withSpring(1, springConfigs.bouncy);
  opacity.value = withTiming(1, timingConfigs.fast);
  backdropOpacity.value = withTiming(0.5, timingConfigs.fast);

  return (
    <AnimatedView
      style={backdropStyle}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        className
      )}
      onClick={handleCancel}
    >
      <AnimatedView
        style={modalStyle}
        className={cn(
          'bg-card border border-border rounded-2xl shadow-2xl',
          'p-6 max-w-sm w-full mx-4',
          'transform-gpu'
        )}
        onClick={(e?: React.MouseEvent) => {
          if (e) {
            e.stopPropagation();
          }
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                context === 'admin-delete' ? 'bg-destructive/20' : 'bg-muted'
              )}
            >
              <Trash
                size={24}
                className={cn(context === 'admin-delete' ? 'text-destructive' : 'text-foreground')}
                weight="bold"
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {context === 'admin-delete' ? 'Delete Message' : 'Delete this message?'}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {messagePreview && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground line-clamp-2">{messagePreview}</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          {context === 'admin-delete'
            ? 'This message will be permanently removed from the chat.'
            : 'This action cannot be undone.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-muted hover:bg-muted/80',
              'text-foreground font-medium',
              'transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-destructive hover:bg-destructive/90',
              'text-destructive-foreground font-medium',
              'transition-colors'
            )}
          >
            Delete
          </button>
        </div>
      </AnimatedView>
    </AnimatedView>
  );
}
