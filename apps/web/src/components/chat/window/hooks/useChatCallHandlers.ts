import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import type { ChatRoom } from '@/lib/chat-types';

const logger = createLogger('ChatWindowCallHandlers');

interface UseChatCallHandlersProps {
  room: ChatRoom;
  initiateCall: (
    petId: string,
    petName: string,
    petPhoto: string | undefined,
    type: 'voice' | 'video'
  ) => Promise<void>;
}

/**
 * Hook for managing call initiation handlers
 */
export function useChatCallHandlers({ room, initiateCall }: UseChatCallHandlersProps) {
  const handleVoiceCall = () => {
    try {
      haptics.trigger('heavy');
      const petId = room.matchedPetId;
      const petName = room.matchedPetName;
      if (petId && petName) {
        void initiateCall(petId, petName, room.matchedPetPhoto ?? undefined, 'voice').catch(
          (error) => {
            const err = normalizeError(_error);
            logger.error('ChatWindowNew handleVoiceCall error', err, { petId, petName });
            toast.error('Failed to start voice call. Please try again.');
          }
        );
        toast.info('Starting voice call...');
      } else {
        logger.warn('ChatWindowNew handleVoiceCall missing petId or petName', { petId, petName });
        toast.error('Unable to start call. Pet information is missing.');
      }
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('ChatWindowNew handleVoiceCall sync _error', err);
      toast.error('Failed to start voice call. Please try again.');
    }
  };

  const handleVideoCall = () => {
    try {
      haptics.trigger('heavy');
      const petId = room.matchedPetId;
      const petName = room.matchedPetName;
      if (petId && petName) {
        void initiateCall(petId, petName, room.matchedPetPhoto ?? undefined, 'video').catch(
          (error) => {
            const err = normalizeError(_error);
            logger.error('ChatWindowNew handleVideoCall error', err, { petId, petName });
            toast.error('Failed to start video call. Please try again.');
          }
        );
        toast.info('Starting video call...');
      } else {
        logger.warn('ChatWindowNew handleVideoCall missing petId or petName', { petId, petName });
        toast.error('Unable to start call. Pet information is missing.');
      }
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('ChatWindowNew handleVideoCall sync _error', err);
      toast.error('Failed to start video call. Please try again.');
    }
  };

  return {
    handleVoiceCall,
    handleVideoCall,
  };
}

