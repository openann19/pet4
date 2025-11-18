import { Clock, Check, Checks, X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import type { AnimatedStyle } from '@petspark/motion';
import type { Message } from '@/lib/chat-types';

interface MessageStatusIconProps {
  status: Message['status'];
  statusStyle: AnimatedStyle;
  onRetry?: () => void;
}

export function MessageStatusIcon({ status, statusStyle, onRetry }: MessageStatusIconProps) {
  if (status === 'sending') {
    return (
      <MotionView style={statusStyle}>
        <Clock size={12} className="text-muted-foreground" />
      </MotionView>
    );
  }

  if (status === 'failed') {
    return (
      <button
        onClick={() => void onRetry()}
        className="text-destructive hover:text-destructive/80"
        aria-label="Retry sending"
      >
        <X size={12} />
      </button>
    );
  }

  if (status === 'read') {
    return (
      <MotionView style={statusStyle}>
        <Checks size={12} className="text-primary" />
      </MotionView>
    );
  }

  if (status === 'delivered') {
    return (
      <MotionView style={statusStyle}>
        <Checks size={12} className="text-muted-foreground" />
      </MotionView>
    );
  }

  return (
    <MotionView style={statusStyle}>
      <Check size={12} className="text-muted-foreground" />
    </MotionView>
  );
}

