import { Image as ImageIcon } from '@phosphor-icons/react';
import { SmartImage } from '@/components/media/SmartImage';
import type { Message } from '@/lib/chat-types';

interface ImageMessageContentProps {
  message: Message;
  imageError: boolean;
}

export function ImageMessageContent({ message, imageError }: ImageMessageContentProps) {
  if (!message.metadata?.media) {
    return null;
  }

  return (
    <div className="relative">
      {imageError ? (
        <div className="flex items-center justify-center w-48 h-48 bg-muted rounded-lg">
          <ImageIcon size={32} className="text-muted-foreground" />
        </div>
      ) : (
        <SmartImage
          src={message.metadata.media.url}
          {...(message.metadata.media.thumbnail
            ? { lqip: message.metadata.media.thumbnail }
            : {})}
          alt={message.content ?? 'Image'}
          className="max-w-full h-auto rounded-lg cursor-pointer"
          onLoad={() => {
            // Image loaded successfully
          }}
          onClick={() => {
            const mediaUrl = message.metadata?.media?.url;
            if (mediaUrl) {
              window.open(mediaUrl, '_blank');
            }
          }}
        />
      )}
      {message.content && (
        <p className="mt-2 wrap-break-word whitespace-pre-wrap">{message.content}</p>
      )}
    </div>
  );
}

