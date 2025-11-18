'use client';

import { useCallback, useState } from 'react';
import type { ChatMessage } from '@/lib/chat-types';
import { generateMessageId } from '@/lib/chat-utils';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useMedia');

export interface UseMediaOptions {
  onSendMessage: (
    content: string,
    type: ChatMessage['type'],
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ) => void;
  messages: ChatMessage[];
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
}

export interface UseMediaReturn {
  isRecordingVoice: boolean;
  setIsRecordingVoice: React.Dispatch<React.SetStateAction<boolean>>;
  handleVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  handleShareLocation: () => void;
  handleTranslateMessage: (messageId: string) => Promise<void>;
}

export function useMedia(options: UseMediaOptions): UseMediaReturn {
  const { onSendMessage, messages, updateMessage } = options;

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const handleVoiceRecorded = useCallback(
    (audioBlob: Blob, duration: number, waveform: number[]): void => {
      const voiceUrl = URL.createObjectURL(audioBlob);

      onSendMessage(
        'Voice message',
        'voice',
        [
          {
            id: generateMessageId(),
            type: 'voice',
            url: voiceUrl,
            duration,
            mimeType: audioBlob.type,
          },
        ],
        {
          voiceNote: {
            duration,
            waveform,
          },
        }
      );
    },
    [onSendMessage]
  );

  const handleShareLocation = useCallback((): void => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSendMessage('Shared my location', 'location', undefined, {
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: 'Current Location',
            },
          });
          toast.success('Location shared!');
        },
        () => {
          toast.error('Unable to access location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  }, [onSendMessage]);

  const handleTranslateMessage = useCallback(
    async (messageId: string): Promise<void> => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      try {
        const { buildLLMPrompt } = await import('@/lib/llm-prompt');
        const { llmService } = await import('@/lib/llm-service');
        const { parseLLMError } = await import('@/lib/llm-utils');
        const prompt = buildLLMPrompt`Translate the following message to English. Return only the translated text without any explanation: "${message.content}"`;
        const translated = await llmService.llm(prompt, 'gpt-4o-mini');

        updateMessage(messageId, {
          metadata: {
            ...message.metadata,
            translation: {
              originalLang: 'auto',
              targetLang: 'en',
              translatedText: translated,
            },
          },
        });
        toast.success('Message translated!');
      } catch (_error) {
        const { parseLLMError } = await import('@/lib/llm-utils');
        const errorInfo = parseLLMError(_error);
        logger.error(
          'Translation failed',
          _error instanceof Error ? _error : new Error(String(_error)),
          { technicalMessage: errorInfo.technicalMessage }
        );
        toast.error('Translation failed', {
          description: errorInfo.userMessage,
          duration: 5000,
        });
      }
    },
    [messages, updateMessage]
  );

  return {
    isRecordingVoice,
    setIsRecordingVoice,
    handleVoiceRecorded,
    handleShareLocation,
    handleTranslateMessage,
  };
}
