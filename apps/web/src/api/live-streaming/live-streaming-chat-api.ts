import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type { LiveStreamChatMessage } from '@/lib/live-streaming-types';
import { createLogger } from '@/lib/logger';
import { realtime } from '@/lib/realtime';
import type {
  QueryChatMessagesResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from '../live-streaming-api-types';

const logger = createLogger('LiveStreamingChatApi');

/**
 * Broadcasts a chat message via WebSocket
 */
function broadcastChatMessage(
  roomId: string,
  message: LiveStreamChatMessage
): void {
  try {
    realtime.broadcastChatMessage(roomId, {
      id: message.id,
      userId: message.userId,
      userName: message.userName,
      ...(message.userAvatar ? { userAvatar: message.userAvatar } : {}),
      text: message.text,
      createdAt: message.createdAt,
    });
    logger.debug('Chat message broadcasted', {
      roomId,
      messageId: message.id,
    });
  } catch (error) {
    const err = normalizeError(error);
    logger.error('Failed to broadcast chat message', err, {
      roomId,
      messageId: message.id,
    });
    // Don't fail message creation if broadcast fails
  }
}

/**
 * Chat-related API methods for live streaming
 */
export class LiveStreamingChatApi {
  async sendChatMessage(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string,
    getStreamById: (id: string) => Promise<{ allowChat: boolean; status: string; roomId: string } | null>
  ): Promise<LiveStreamChatMessage> {
    try {
      const stream = await getStreamById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }
      if (!stream.allowChat) {
        throw new Error('Chat is disabled for this stream');
      }
      if (stream.status !== 'live') {
        throw new Error('Stream is not live');
      }

      const request: SendChatMessageRequest = {
        userId,
        userName,
        ...(userAvatar !== undefined && { userAvatar }),
        text,
      };

      const response = await APIClient.post<SendChatMessageResponse>(
        ENDPOINTS.STREAMING.SEND_CHAT(streamId),
        request
      );

      const message = response.data.message;
      broadcastChatMessage(stream.roomId, message);

      return message;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to send chat message', err, { streamId, userId });
      throw err;
    }
  }

  async queryChatMessages(streamId: string): Promise<LiveStreamChatMessage[]> {
    try {
      const response = await APIClient.get<QueryChatMessagesResponse>(
        ENDPOINTS.STREAMING.GET_CHAT(streamId)
      );
      return response.data.messages;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to query chat messages', err, { streamId });
      throw err;
    }
  }
}
