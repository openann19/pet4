import { cn } from '@/lib/utils';
import { formatTime } from '../utils';
import { MessageStatusIcon } from './MessageStatusIcon';
import type { Message } from '@/lib/chat-types';
import type  from '@petspark/motion';

interface MessageMetadataProps {
  message: Message;
  isOwn: boolean;
  isClusterEnd: boolean;
  showTimestamp: boolean;
  statusStyle: AnimatedStyle;
  onRetry?: () => void;
}

export function MessageMetadata({
  message,
  isOwn,
  isClusterEnd,
  showTimestamp,
  statusStyle,
  onRetry,
}: MessageMetadataProps) {
  return (
    <div
      className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}
    >
      {isOwn && (
        <div className="flex items-center gap-1">
          <MessageStatusIcon status={message.status} statusStyle={statusStyle} onRetry={onRetry} />
        </div>
      )}
      {(showTimestamp || isClusterEnd) && (
        <span className={cn('text-xs', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
          {formatTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}

