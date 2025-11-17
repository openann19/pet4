import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type { LiveStreamReaction } from '@/lib/live-streaming-types';
import { createLogger } from '@/lib/logger';
import type { SendReactionRequest, SendReactionResponse } from '../live-streaming-api-types';

const logger = createLogger('LiveStreamingReactionsApi');

/**
 * Reactions API methods for live streaming
 */
export class LiveStreamingReactionsApi {
  async sendReaction(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: '❤️' | '🔥' | '👏' | '😊' | '🎉'
  ): Promise<LiveStreamReaction> {
    try {
      const request: SendReactionRequest = {
        userId,
        userName,
        ...(userAvatar !== undefined && { userAvatar }),
        emoji: emoji,
      };

      const response = await APIClient.post<SendReactionResponse>(
        ENDPOINTS.STREAMING.SEND_REACTION(streamId),
        request
      );

      return response.data.reaction;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to send reaction', err, { streamId, userId });
      throw err;
    }
  }
}

