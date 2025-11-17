import { MapPin } from '@phosphor-icons/react';
import type { Message } from '@/lib/chat-types';

interface LocationMessageContentProps {
  message: Message;
}

export function LocationMessageContent({ message }: LocationMessageContentProps) {
  if (!message.metadata?.location) {
    return null;
  }

  return (
    <button
      className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
      onClick={() => {
        const location = message.metadata?.location;
        if (location) {
          const { lat, lng } = location;
          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        }
      }}
    >
      <MapPin size={16} />
      <span className="text-xs">
        {message.metadata.location.address ??
          `${message.metadata.location.lat}, ${message.metadata.location.lng}`}
      </span>
    </button>
  );
}

