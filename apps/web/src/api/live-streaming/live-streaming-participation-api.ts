import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type { LiveStreamViewer } from '@/lib/live-streaming-types';
import { createLogger } from '@/lib/logger';
import type { JoinStreamRequest, JoinStreamResponse } from '../live-streaming-api-types';

const logger = createLogger('LiveStreamingParticipationApi');

/**
 * Stream participation API methods (join/leave)
 */
export class LiveStreamingParticipationApi {
  async joinStream(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined
  ): Promise<{ viewer: LiveStreamViewer; joinToken: string }> {
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

      return {
        viewer: response.data.viewer,
        joinToken: response.data.joinToken,
      };
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to join stream', err, { streamId, userId });
      throw err;
    }
  }

  async leaveStream(streamId: string, userId: string): Promise<void> {
    try {
      await APIClient.post(ENDPOINTS.STREAMING.LEAVE_STREAM(streamId), {
        userId,
      });
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to leave stream', err, { streamId, userId });
      throw err;
    }
  }
}

