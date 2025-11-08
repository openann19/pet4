import { compositeStreamToHLS, deleteLiveKitRoom } from '@/core/services/token-signing';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type {
  CreateLiveStreamData,
  LiveStream,
  LiveStreamChatMessage,
  LiveStreamFilters,
  LiveStreamReaction,
  LiveStreamViewer,
} from '@/lib/live-streaming-types';
import { createLogger } from '@/lib/logger';
import { realtime } from '@/lib/realtime';

const logger = createLogger('LiveStreamingAPI');

export interface CreateRoomRequest extends CreateLiveStreamData {
  hostId: string;
  hostName: string;
  hostAvatar?: string;
}

export interface CreateRoomResponse {
  stream: LiveStream;
  joinToken: string;
  publishToken: string;
}

export interface EndRoomResponse {
  stream: LiveStream;
}

export interface QueryActiveStreamsResponse {
  streams: LiveStream[];
  nextCursor?: string;
  total: number;
}

export interface JoinStreamRequest {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface JoinStreamResponse {
  viewer: LiveStreamViewer;
}

export interface SendReactionRequest {
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: '❤️' | '👏' | '🔥' | '😊' | '🎉';
}

export interface SendReactionResponse {
  reaction: LiveStreamReaction;
}

export interface SendChatMessageRequest {
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
}

export interface SendChatMessageResponse {
  message: LiveStreamChatMessage;
}

export interface QueryChatMessagesResponse {
  messages: LiveStreamChatMessage[];
}

/**
 * Go Live (Streaming) API Service
 * Implements REST API endpoints as specified:
 * POST /live/createRoom           // returns join tokens
 * POST /live/endRoom
 * GET  /live/active               // discovery
 * WS   /live/:roomId/chat
 */
export class LiveStreamingAPI {
  /**
   * POST /live/createRoom
   * Create a live stream room and return join tokens
   */
  async createRoom(
    data: CreateLiveStreamData & { hostId: string; hostName: string; hostAvatar?: string }
  ): Promise<{ stream: LiveStream; joinToken: string; publishToken: string }> {
    try {
      const request: CreateRoomRequest = {
        ...data,
        hostId: data.hostId,
        hostName: data.hostName,
        ...(data.hostAvatar ? { hostAvatar: data.hostAvatar } : {}),
      };

      const response = await APIClient.post<CreateRoomResponse>(
        ENDPOINTS.STREAMING.CREATE_ROOM,
        request
      );

      const { stream, joinToken, publishToken } = response.data;

      // Tokens should be provided by the server
      // Client-side token signing is not secure and not supported
      if (!joinToken || !publishToken) {
        const missingTokens = [];
        if (!joinToken) missingTokens.push('joinToken');
        if (!publishToken) missingTokens.push('publishToken');

        logger.error('Server did not provide required LiveKit tokens', {
          roomId: stream.roomId,
          hostId: data.hostId,
          missingTokens,
        });

        throw new Error(
          `Server did not provide required LiveKit tokens: ${missingTokens.join(', ')}. ` +
            'LiveKit tokens must be generated server-side for security.'
        );
      }

      return {
        stream,
        joinToken,
        publishToken,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create room', err, { hostId: data.hostId });
      throw err;
    }
  }

  /**
   * POST /live/endRoom
   * End a live stream
   */
  async endRoom(streamId: string, hostId: string): Promise<LiveStream> {
    try {
      const response = await APIClient.post<EndRoomResponse>(ENDPOINTS.STREAMING.END_ROOM, {
        streamId,
        hostId,
      });

      const stream = response.data.stream;

      // Server-side composite to HLS and store VOD
      try {
        if (stream.roomId) {
          const vodResult = await compositeStreamToHLS(stream.roomId);
          if (vodResult) {
            logger.info('VOD recording completed', {
              streamId: stream.id,
              vodUrl: vodResult.vodUrl,
            });
          }
        }
      } catch (error) {
        logger.error(
          'Failed to create VOD recording',
          error instanceof Error ? error : new Error(String(error)),
          {
            streamId: stream.id,
            roomId: stream.roomId,
          }
        );
        // Don't fail stream ending if VOD recording fails
      }

      // Close LiveKit room
      try {
        if (stream.roomId) {
          await deleteLiveKitRoom(stream.roomId);
          logger.info('LiveKit room closed', {
            streamId: stream.id,
            roomId: stream.roomId,
          });
        }
      } catch (error) {
        logger.error(
          'Failed to close LiveKit room',
          error instanceof Error ? error : new Error(String(error)),
          {
            streamId: stream.id,
            roomId: stream.roomId,
          }
        );
        // Don't fail stream ending if room deletion fails
      }

      return stream;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to end room', err, { streamId, hostId });
      throw err;
    }
  }

  /**
   * GET /live/active
   * Discovery of active streams
   */
  async queryActiveStreams(
    filters?: LiveStreamFilters
  ): Promise<{ streams: LiveStream[]; nextCursor?: string; total: number }> {
    try {
      const queryParams: Record<string, unknown> = {};

      if (filters?.status && filters.status.length > 0) {
        queryParams['status'] = filters.status;
      }

      if (filters?.category && filters.category.length > 0) {
        queryParams['category'] = filters.category;
      }

      if (filters?.hostId) {
        queryParams['hostId'] = filters.hostId;
      }

      if (filters?.sortBy) {
        queryParams['sortBy'] = filters.sortBy;
      }

      if (filters?.cursor) {
        queryParams['cursor'] = filters.cursor;
      }

      if (filters?.limit) {
        queryParams['limit'] = filters.limit;
      }

      const url =
        ENDPOINTS.STREAMING.QUERY_ACTIVE +
        (Object.keys(queryParams).length > 0
          ? '?' +
            new URLSearchParams(
              Object.entries(queryParams).map(([k, v]) => [k, String(v)])
            ).toString()
          : '');

      const response = await APIClient.get<QueryActiveStreamsResponse>(url);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to query active streams', err, { filters });
      throw err;
    }
  }

  /**
   * GET /live/:id
   */
  async getStreamById(id: string): Promise<LiveStream | null> {
    try {
      const response = await APIClient.get<{ stream: LiveStream }>(
        ENDPOINTS.STREAMING.GET_STREAM(id)
      );
      return response.data.stream;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // If 404, return null instead of throwing
      if (err.message.includes('404') || err.message.includes('not found')) {
        return null;
      }
      logger.error('Failed to get stream by ID', err, { id });
      throw err;
    }
  }

  /**
   * POST /live/:id/join
   * Join a stream (increment viewer count)
   */
  async joinStream(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar?: string
  ): Promise<LiveStreamViewer> {
    try {
      const request: JoinStreamRequest = {
        userId,
        userName,
        ...(userAvatar !== undefined && { userAvatar }),
      };

      const response = await APIClient.post<JoinStreamResponse>(
        ENDPOINTS.STREAMING.JOIN_STREAM(streamId),
        request
      );

      return response.data.viewer;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to join stream', err, { streamId, userId });
      throw err;
    }
  }

  /**
   * POST /live/:id/leave
   * Leave a stream (decrement viewer count)
   */
  async leaveStream(streamId: string, userId: string): Promise<void> {
    try {
      await APIClient.post(ENDPOINTS.STREAMING.LEAVE_STREAM(streamId), { userId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to leave stream', err, { streamId, userId });
      throw err;
    }
  }

  /**
   * POST /live/:id/react
   * Send a reaction (❤️👏🔥)
   */
  async sendReaction(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: '❤️' | '👏' | '🔥' | '😊' | '🎉'
  ): Promise<LiveStreamReaction> {
    try {
      const request: SendReactionRequest = {
        userId,
        userName,
        ...(userAvatar !== undefined && { userAvatar }),
        emoji,
      };

      const response = await APIClient.post<SendReactionResponse>(
        ENDPOINTS.STREAMING.SEND_REACTION(streamId),
        request
      );

      const reaction = response.data.reaction;

      // Broadcast reaction via WebSocket to all viewers
      try {
        const stream = await this.getStreamById(streamId);
        const roomId = stream?.roomId || `live:${streamId}`;
        realtime.broadcastReaction(roomId, {
          id: reaction.id,
          userId: reaction.userId,
          userName: reaction.userName,
          ...(reaction.userAvatar ? { userAvatar: reaction.userAvatar } : {}),
          emoji: reaction.emoji,
          createdAt: reaction.createdAt,
        });
        logger.debug('Reaction broadcasted', {
          streamId,
          reactionId: reaction.id,
        });
      } catch (error) {
        logger.error(
          'Failed to broadcast reaction',
          error instanceof Error ? error : new Error(String(error)),
          {
            streamId,
            reactionId: reaction.id,
          }
        );
        // Don't fail reaction creation if broadcast fails
      }

      return reaction;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send reaction', err, { streamId, userId });
      throw err;
    }
  }

  /**
   * POST /live/:id/chat
   * Send a chat message (via WebSocket in real app)
   */
  async sendChatMessage(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string
  ): Promise<LiveStreamChatMessage> {
    try {
      // Verify stream exists and allows chat
      const stream = await this.getStreamById(streamId);
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

      // Broadcast via WebSocket: live:<roomId>:chat
      try {
        realtime.broadcastChatMessage(stream.roomId, {
          id: message.id,
          userId: message.userId,
          userName: message.userName,
          ...(message.userAvatar ? { userAvatar: message.userAvatar } : {}),
          text: message.text,
          createdAt: message.createdAt,
        });
        logger.debug('Chat message broadcasted', {
          streamId,
          messageId: message.id,
        });
      } catch (error) {
        logger.error(
          'Failed to broadcast chat message',
          error instanceof Error ? error : new Error(String(error)),
          {
            streamId,
            messageId: message.id,
          }
        );
        // Don't fail message creation if broadcast fails
      }

      return message;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send chat message', err, { streamId, userId });
      throw err;
    }
  }

  /**
   * GET /live/:id/chat
   * Get chat messages
   */
  async queryChatMessages(streamId: string): Promise<LiveStreamChatMessage[]> {
    try {
      const response = await APIClient.get<QueryChatMessagesResponse>(
        ENDPOINTS.STREAMING.GET_CHAT(streamId)
      );
      return response.data.messages;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to query chat messages', err, { streamId });
      throw err;
    }
  }

  /**
   * Admin: Get all streams
   */
  async getAllStreams(): Promise<LiveStream[]> {
    try {
      const response = await this.queryActiveStreams({ limit: 1000 });
      return response.streams;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all streams', err);
      throw err;
    }
  }
}

export const liveStreamingAPI = new LiveStreamingAPI();
