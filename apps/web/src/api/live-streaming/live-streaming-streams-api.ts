import { compositeStreamToHLS, deleteLiveKitRoom } from '@/core/services/token-signing';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type {
  CreateLiveStreamData,
  LiveStream,
  LiveStreamFilters,
} from '@/lib/live-streaming-types';
import { createLogger } from '@/lib/logger';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  EndRoomResponse,
  QueryActiveStreamsResponse,
} from '../live-streaming-api-types';

const logger = createLogger('LiveStreamingStreamsApi');

/**
 * Stream management API methods
 */
export class LiveStreamingStreamsApi {
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

      return { stream, joinToken, publishToken };
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to create room', err, { hostId: data.hostId });
      throw err;
    }
  }

  async endRoom(streamId: string, hostId: string): Promise<LiveStream> {
    try {
      const response = await APIClient.post<EndRoomResponse>(ENDPOINTS.STREAMING.END_ROOM, {
        streamId,
        hostId,
      });

      const stream = response.data.stream;

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
      } catch (_error) {
        const err = normalizeError(_error);
        logger.error('Failed to create VOD recording', err, {
          streamId: stream.id,
          roomId: stream.roomId,
        });
      }

      try {
        if (stream.roomId) {
          await deleteLiveKitRoom(stream.roomId);
        }
      } catch (_error) {
        const err = normalizeError(_error);
        logger.error('Failed to delete LiveKit room', err, {
          streamId: stream.id,
          roomId: stream.roomId,
        });
      }

      return stream;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to end room', err, { streamId, hostId });
      throw err;
    }
  }

  async queryActiveStreams(
    filters?: LiveStreamFilters
  ): Promise<{ streams: LiveStream[]; total: number }> {
    try {
      const queryParams: Record<string, unknown> = {};

      if (filters?.hostId) {
        queryParams.hostId = filters.hostId;
      }

      if (filters?.status && filters.status.length > 0) {
        queryParams.status = filters.status;
      }

      if (filters && 'tags' in filters && filters.tags && filters.tags.length > 0) {
        queryParams.tags = filters.tags;
      }

      if (filters?.limit) {
        queryParams.limit = filters.limit;
      }

      if (filters?.cursor) {
        queryParams.cursor = filters.cursor;
      }

      const url =
        ENDPOINTS.STREAMING.ACTIVE_STREAMS +
        (Object.keys(queryParams).length > 0
          ? '?' +
            new URLSearchParams(
              Object.entries(queryParams).map(([k, v]) => [k, String(v)])
            ).toString()
          : '');

      const response = await APIClient.get<QueryActiveStreamsResponse>(url);
      return response.data;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to query active streams', err, { filters });
      throw err;
    }
  }

  async getStreamById(id: string): Promise<LiveStream | null> {
    try {
      const response = await APIClient.get<{ stream: LiveStream }>(
        ENDPOINTS.STREAMING.STREAM(id)
      );
      return response.data.stream ?? null;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get stream', err, { streamId: id });
      return null;
    }
  }

  async getAllStreams(): Promise<LiveStream[]> {
    try {
      const result = await this.queryActiveStreams();
      return result.streams;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get all streams', err);
      throw err;
    }
  }
}

