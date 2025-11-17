import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import type { ChatMessage } from '@/lib/chat-types';
import { generateMessageId } from '@/lib/chat-utils';

const logger = createLogger('ChatWindowVoicePlayback');

interface VoiceMessageData {
  blob: string;
  duration: number;
  waveform: number[];
}

interface UseChatVoicePlaybackProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  voiceMessages: Record<string, VoiceMessageData> | undefined;
  setVoiceMessage: (messageId: string, data: VoiceMessageData) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsRecording: (recording: boolean) => void;
}

/**
 * Hook for managing voice message recording and playback
 */
export function useChatVoicePlayback({
  roomId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  voiceMessages,
  setVoiceMessage,
  setMessages,
  setIsRecording,
}: UseChatVoicePlaybackProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoiceRecorded = (audioBlob: Blob, duration: number, waveform: number[]) => {
    try {
      const messageId = generateMessageId();

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64Audio = reader.result as string;
          if (!base64Audio) {
            logger.error(
              'ChatWindowNew handleVoiceRecorded empty result',
              new Error('FileReader returned empty result'),
              { messageId, duration }
            );
            toast.error('Failed to process voice message. Please try again.');
            setIsRecording(false);
            return;
          }

          setVoiceMessage(messageId, { blob: base64Audio, duration, waveform });

          const newMessage: ChatMessage = {
            id: messageId,
            roomId,
            senderId: currentUserId,
            senderName: currentUserName,
            content: `Voice message (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
            type: 'voice',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: 'sent',
            reactions: [],
          };
          if (currentUserAvatar !== undefined) {
            newMessage.senderAvatar = currentUserAvatar;
          }

          setMessages((current: ChatMessage[]) => [...(current ?? []), newMessage]);
          setIsRecording(false);

          toast.success('Voice message sent!', {
            duration: 1500,
            position: 'top-center',
          });
        } catch (error) {
          const err = normalizeError(error);
          logger.error('ChatWindowNew handleVoiceRecorded onloadend error', err, { messageId });
          toast.error('Failed to process voice message. Please try again.');
          setIsRecording(false);
        }
      };

      reader.onerror = () => {
        logger.error(
          'ChatWindowNew handleVoiceRecorded FileReader error',
          new Error('FileReader failed'),
          { messageId }
        );
        toast.error('Failed to read voice message. Please try again.');
        setIsRecording(false);
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('ChatWindowNew handleVoiceRecorded error', err, { duration });
      toast.error('Failed to record voice message. Please try again.');
      setIsRecording(false);
    }
  };

  const handleVoiceCancel = () => {
    setIsRecording(false);
    toast.info('Recording cancelled', {
      duration: 1000,
      position: 'top-center',
    });
  };

  const toggleVoicePlayback = (messageId: string) => {
    if (!voiceMessages) return;

    const voiceData = voiceMessages[messageId];
    if (!voiceData) return;

    if (playingVoice === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(voiceData.blob);
    audio.onended = () => {
      setPlayingVoice(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      logger.error('ChatWindowNew audio playback error', new Error('Audio playback failed'), {
        messageId,
      });
      toast.error('Failed to play voice message. Please try again.');
      setPlayingVoice(null);
      audioRef.current = null;
    };
    void audio.play().catch((error) => {
      const err = normalizeError(error);
      logger.error('ChatWindowNew audio.play() error', err, { messageId });
      toast.error('Failed to play voice message. Please try again.');
      setPlayingVoice(null);
      audioRef.current = null;
    });
    audioRef.current = audio;
    setPlayingVoice(messageId);
  };

  return {
    playingVoice,
    handleVoiceRecorded,
    handleVoiceCancel,
    toggleVoicePlayback,
  };
}

