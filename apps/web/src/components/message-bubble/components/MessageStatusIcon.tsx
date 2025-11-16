import { Clock, Check, Checks, X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import type { Message } from '@/lib/chat-types';

interface MessageStatusIconProps {
  status: Message['status'];
  statusStyle: AnimatedStyle;
  onRetry?: () => void;
}

export function MessageStatusIcon({ status, statusStyle, onRetry }: MessageStatusIconProps) {
  if (status === 'sending') {
    return (
      <MotionView animatedStyle={statusStyle}>
        <Clock size={12} className="text-muted-foreground" />
      </MotionView>
    );
  }

  if (status === 'failed') {
    return (
      <button
        onClick={onRetry}
        className="text-destructive hover:text-destructive/80"
        aria-label="Retry sending"
      >
        <X size={12} />
      </button>
    );
  }

  if (status === 'read') {
    return (
      <MotionView animatedStyle={statusStyle}>
        <Checks size={12} className="text-primary" />
      </MotionView>
    );
  }

  if (status === 'delivered') {
    return (
      <MotionView animatedStyle={statusStyle}>
        <Checks size={12} className="text-muted-foreground" />
      </MotionView>
    );
  }

  return (
    <MotionView animatedStyle={statusStyle}>
      <Check size={12} className="text-muted-foreground" />
    </MotionView>
  );
}

