import { liveStreamingAPI } from '@/api/live-streaming-api';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type {
  CreateLiveStreamData,
  LiveStream as LiveStreamAPI,
  LiveStreamChatMessage,
} from './live-streaming-types';
import { createLogger } from './logger';
import type {
  CreateStreamData,
  LiveStream,
  StreamChatMessage,
  StreamReport,
  StreamStatus,
} from './streaming-types';

const logger = createLogger('StreamingService');

// Helper to convert API types to service types
function convertLiveStream(apiStream: LiveStreamAPI): LiveStream {
  // Map status: 'scheduled' | 'live' | 'ended' | 'cancelled' -> 'idle' | 'connecting' | 'live' | 'ending' | 'ended'
  let status: StreamStatus = 'idle';
  if (apiStream.status === 'live') status = 'live';
  else if (apiStream.status === 'ended') status = 'ended';
  else if (apiStream.status === 'cancelled') status = 'ended';
  else if (apiStream.status === 'scheduled') status = 'connecting';

  return {
    id: apiStream.id,
    hostId: apiStream.hostId,
    hostName: apiStream.hostName,
    ...(apiStream.hostAvatar ? { hostAvatar: apiStream.hostAvatar } : {}),
    title: apiStream.title,
    ...(apiStream.description ? { description: apiStream.description } : {}),
    category: apiStream.category as LiveStream['category'], // Type assertion needed due to different category enums
    status,
    allowChat: apiStream.allowChat,
    maxDuration: apiStream.maxDuration ?? 60,
    startedAt: apiStream.startedAt ?? apiStream.createdAt,
    ...(apiStream.endedAt ? { endedAt: apiStream.endedAt } : {}),
    viewerCount: apiStream.viewerCount,
    peakViewerCount: apiStream.peakViewerCount,
    totalViews: apiStream.viewerCount, // Approximate
    likesCount: apiStream.reactionsCount ?? 0,
    roomToken: apiStream.roomId,
    ...(apiStream.vodUrl && { recordingUrl: apiStream.vodUrl }),
    ...((apiStream.posterUrl ?? apiStream.thumbnail)
      ? { thumbnailUrl: apiStream.posterUrl ?? apiStream.thumbnail }
      : {}),
    tags: [],
  };
}

function convertStreamChatMessage(apiMessage: LiveStreamChatMessage): StreamChatMessage {
  return {
    id: apiMessage.id,
    streamId: apiMessage.streamId,
    userId: apiMessage.userId,
    userName: apiMessage.userName,
    ...(apiMessage.userAvatar ? { userAvatar: apiMessage.userAvatar } : {}),
    message: apiMessage.text,
    timestamp: apiMessage.createdAt,
    type: 'message',
  };
}

class StreamingService {
  async createStream(
    hostId: string,
    hostName: string,
    data: CreateStreamData,
    hostAvatar?: string
  ): Promise<LiveStream> {
    try {
      // Check for existing active stream
      const userStreams = await liveStreamingAPI.queryActiveStreams({ hostId });
      const existingStream = userStreams.streams.find((s) => s.status === 'live');

      if (existingStream) {
        throw new Error('You already have an active stream');
      }

      // Map CreateStreamData to CreateLiveStreamData
      const apiData: CreateLiveStreamData = {
        title: data.title,
        category: data.category as CreateLiveStreamData['category'], // Type assertion
        ...(data.description !== undefined && { description: data.description }),
        allowChat: data.allowChat,
        ...(data.maxDuration !== undefined && { maxDuration: data.maxDuration }),
      };

      const result = await liveStreamingAPI.createRoom({
        ...apiData,
        hostId,
        hostName,
        ...(hostAvatar ? { hostAvatar } : {}),
      });

      return convertLiveStream(result.stream);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create stream', err, { hostId });
      throw err;
    }
  }

  async getStreamById(streamId: string): Promise<LiveStream | undefined> {
    try {
      const stream = await liveStreamingAPI.getStreamById(streamId);
      return stream ? convertLiveStream(stream) : undefined;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get stream by ID', err, { streamId });
      throw err;
    }
  }

  async getActiveStreams(category?: string): Promise<LiveStream[]> {
    try {
      const filters = category
        ? {
            category: [
              category as
                | 'general'
                | 'training'
                | 'health'
                | 'entertainment'
                | 'education'
                | 'adoption'
                | 'community',
            ],
          }
        : undefined;
      const response = await liveStreamingAPI.queryActiveStreams(filters);
      return response.streams.map(convertLiveStream);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active streams', err, { category });
      throw err;
    }
  }

  async getUserStreams(userId: string): Promise<LiveStream[]> {
    try {
      const response = await liveStreamingAPI.queryActiveStreams({ hostId: userId });
      return response.streams
        .map(convertLiveStream)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user streams', err, { userId });
      throw err;
    }
  }

  async updateStreamStatus(streamId: string, status: StreamStatus): Promise<void> {
    try {
      // Map StreamStatus to LiveStreamStatus
      let apiStatus: 'live' | 'ended' | 'cancelled' = 'live';
      if (status === 'ended') apiStatus = 'ended';
      else if (status === 'idle' || status === 'ending') apiStatus = 'cancelled';

      // Get stream to get hostId
      const stream = await liveStreamingAPI.getStreamById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      if (apiStatus === 'ended') {
        await liveStreamingAPI.endRoom(streamId, stream.hostId);
      }
      // For other status updates, API will handle it
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update stream status', err, { streamId, status });
      throw err;
    }
  }

  async joinStream(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar?: string
  ): Promise<void> {
    try {
      await liveStreamingAPI.joinStream(streamId, userId, userName, userAvatar);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to join stream', err, { streamId, userId });
      throw err;
    }
  }

  async leaveStream(streamId: string, userId: string): Promise<void> {
    try {
      await liveStreamingAPI.leaveStream(streamId, userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to leave stream', err, { streamId, userId });
      throw err;
    }
  }

  async sendChatMessage(
    streamId: string,
    userId: string,
    userName: string,
    message: string,
    userAvatar?: string
  ): Promise<StreamChatMessage> {
    try {
      const apiMessage = await liveStreamingAPI.sendChatMessage(
        streamId,
        userId,
        userName,
        userAvatar,
        message
      );
      return convertStreamChatMessage(apiMessage);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send chat message', err, { streamId, userId });
      throw err;
    }
  }

  async getChatHistory(streamId: string, limit = 100): Promise<StreamChatMessage[]> {
    try {
      const messages = await liveStreamingAPI.queryChatMessages(streamId);
      return messages.slice(-limit).map(convertStreamChatMessage);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get chat history', err, { streamId });
      throw err;
    }
  }

  incrementLikes(streamId: string): never {
    // This method is deprecated - use sendReaction instead
    // incrementLikes requires userId which is not available in this signature
    // Clients should use sendReaction(streamId, userId, 'like') for proper functionality
    logger.warn('IncrementLikes is deprecated - use sendReaction instead', { streamId });
    throw new Error(
      'incrementLikes requires userId - use sendReaction(streamId, userId, "like") instead'
    );
  }

  async endStream(streamId: string): Promise<void> {
    try {
      const stream = await liveStreamingAPI.getStreamById(streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }
      await liveStreamingAPI.endRoom(streamId, stream.hostId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to end stream', err, { streamId });
      throw err;
    }
  }

  async reportStream(
    streamId: string,
    reporterId: string,
    reason: StreamReport['reason'],
    description?: string
  ): Promise<void> {
    try {
      await APIClient.post(ENDPOINTS.STREAMING.REPORT_STREAM(streamId), {
        reporterId,
        reason: reason as 'spam' | 'inappropriate' | 'harassment' | 'other',
        description,
      });
      logger.info('Stream reported', { streamId, reporterId, reason });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to report stream', err, { streamId, reporterId });
      throw err;
    }
  }

  async banUserFromStream(streamId: string, userId: string): Promise<void> {
    try {
      await liveStreamingAPI.leaveStream(streamId, userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to ban user from stream', err, { streamId, userId });
      throw err;
    }
  }
}

export const streamingService = new StreamingService();
