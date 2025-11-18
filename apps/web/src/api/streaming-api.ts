/**
 * Streaming API Service
 *
 * Handles LiveKit token signing and recording through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('StreamingAPI');

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  room?: string;
  participant?: string;
}

export interface StartRecordingRequest {
  roomId: string;
  recordingType: 'hls' | 'webm';
}

export interface StartRecordingResponse {
  recordingId: string;
  status: 'recording';
}

export interface GetRecordingRequest {
  recordingId: string;
}

export interface GetRecordingResponse {
  recordingId: string;
  roomId: string;
  status: 'recording' | 'completed' | 'failed';
  url?: string;
  hlsUrl?: string;
}

class StreamingApiImpl {
  /**
   * POST /streaming/token-verify
   * Verify LiveKit token (server-side)
   */
  async verifyToken(
    token: string
  ): Promise<{ valid: boolean; room?: string; participant?: string }> {
    try {
      const request: VerifyTokenRequest = { token };
      const response = await APIClient.post<VerifyTokenResponse>(
        '/streaming/token-verify',
        request
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to verify token', err);
      throw err;
    }
  }

  /**
   * POST /streaming/recording/start
   * Start HLS VOD recording
   */
  async startRecording(
    roomId: string,
    recordingType: 'hls' | 'webm' = 'hls'
  ): Promise<{ recordingId: string; status: 'recording' }> {
    try {
      const request: StartRecordingRequest = {
        roomId,
        recordingType,
      };
      const response = await APIClient.post<StartRecordingResponse>(
        '/streaming/recording/start',
        request
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to start recording', err, { roomId });
      throw err;
    }
  }

  /**
   * GET /streaming/recording/:recordingId
   * Get recording status and URL
   */
  async getRecording(recordingId: string): Promise<{
    recordingId: string;
    roomId: string;
    status: 'recording' | 'completed' | 'failed';
    url?: string;
    hlsUrl?: string;
  }> {
    try {
      const response = await APIClient.get<GetRecordingResponse>(
        `/streaming/recording/${recordingId}`
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get recording', err, { recordingId });
      throw err;
    }
  }
}

export const streamingApi = new StreamingApiImpl();
