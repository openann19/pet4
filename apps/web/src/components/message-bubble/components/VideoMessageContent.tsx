import type { Message } from '@/lib/chat-types';

interface VideoMessageContentProps {
  message: Message;
}

export function VideoMessageContent({ message }: VideoMessageContentProps) {
  if (!message.metadata?.media) {
    return null;
  }

  return (
    <div className="relative">
      <video
        src={message.metadata.media.url}
        poster={message.metadata.media.thumbnail}
        controls
        className="max-w-full h-auto rounded-lg"
        preload="metadata"
      />
      {message.content && (
        <p className="mt-2 wrap-break-word whitespace-pre-wrap">{message.content}</p>
      )}
    </div>
  );
}

