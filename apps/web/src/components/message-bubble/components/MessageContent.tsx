import type { Message } from '@/lib/chat-types';
import type { useAITypingReveal } from '@/hooks/use-ai-typing-reveal';
import type { useVoiceWaveform } from '@/hooks/use-voice-waveform';
import type { DeleteAnimationContext } from '@/hooks/use-delete-bubble-animation';
import { TextMessageContent } from './TextMessageContent';
import { ImageMessageContent } from './ImageMessageContent';
import { VideoMessageContent } from './VideoMessageContent';
import { VoiceMessageContent } from './VoiceMessageContent';
import { LocationMessageContent } from './LocationMessageContent';
import { StickerMessageContent } from './StickerMessageContent';

interface MessageContentProps {
  message: Message;
  isAIMessage: boolean;
  typingReveal: ReturnType<typeof useAITypingReveal>;
  voiceWaveform: ReturnType<typeof useVoiceWaveform>;
  imageError: boolean;
  deleteContext: DeleteAnimationContext;
  onDeleteFinish: () => void;
}

export function MessageContent({
  message,
  isAIMessage,
  typingReveal,
  voiceWaveform,
  imageError,
  deleteContext,
  onDeleteFinish,
}: MessageContentProps) {
  switch (message.type) {
    case 'text':
      return (
        <TextMessageContent
          message={message}
          isAIMessage={isAIMessage}
          typingReveal={typingReveal}
          deleteContext={deleteContext}
          onDeleteFinish={onDeleteFinish}
        />
      );
    case 'image':
      return <ImageMessageContent message={message} imageError={imageError} />;
    case 'video':
      return <VideoMessageContent message={message} />;
    case 'voice':
      return <VoiceMessageContent message={message} voiceWaveform={voiceWaveform} />;
    case 'location':
      return <LocationMessageContent message={message} />;
    case 'sticker':
      return <StickerMessageContent content={message.content} />;
    default:
      return null;
  }
}

