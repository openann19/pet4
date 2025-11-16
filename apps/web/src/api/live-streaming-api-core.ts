import type {
  CreateLiveStreamData,
  LiveStream,
  LiveStreamChatMessage,
  LiveStreamFilters,
  LiveStreamReaction,
  LiveStreamViewer,
} from '@/lib/live-streaming-types';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import { LiveStreamingChatApi } from './live-streaming/live-streaming-chat-api';
import { LiveStreamingParticipationApi } from './live-streaming/live-streaming-participation-api';
import { LiveStreamingReactionsApi } from './live-streaming/live-streaming-reactions-api';
import { LiveStreamingStreamsApi } from './live-streaming/live-streaming-streams-api';

const logger = createLogger('LiveStreamingAPI');

/**
 * Go Live (Streaming) API Service
 * Composes specialized API modules for streams, participation, chat, and reactions
 */
export class LiveStreamingAPI {
  private streamsApi: LiveStreamingStreamsApi;
  private participationApi: LiveStreamingParticipationApi;
  private chatApi: LiveStreamingChatApi;
  private reactionsApi: LiveStreamingReactionsApi;

  constructor() {
    this.streamsApi = new LiveStreamingStreamsApi();
    this.participationApi = new LiveStreamingParticipationApi();
    this.chatApi = new LiveStreamingChatApi();
    this.reactionsApi = new LiveStreamingReactionsApi();
  }

  async createRoom(
    data: CreateLiveStreamData & { hostId: string; hostName: string; hostAvatar?: string }
  ): Promise<{ stream: LiveStream; joinToken: string; publishToken: string }> {
    return this.streamsApi.createRoom(data);
  }

  async endRoom(streamId: string, hostId: string): Promise<LiveStream> {
    return this.streamsApi.endRoom(streamId, hostId);
  }

  async queryActiveStreams(
    filters?: LiveStreamFilters
  ): Promise<{ streams: LiveStream[]; total: number }> {
    return this.streamsApi.queryActiveStreams(filters);
  }

  async getStreamById(id: string): Promise<LiveStream | null> {
    return this.streamsApi.getStreamById(id);
  }

  async joinStream(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined
  ): Promise<{ viewer: LiveStreamViewer; joinToken: string }> {
    return this.participationApi.joinStream(streamId, userId, userName, userAvatar);
  }

  async leaveStream(streamId: string, userId: string): Promise<void> {
    return this.participationApi.leaveStream(streamId, userId);
  }

  async sendReaction(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: '❤️' | '👏' | '🔥' | '😊' | '🎉'
  ): Promise<LiveStreamReaction> {
    return this.reactionsApi.sendReaction(streamId, userId, userName, userAvatar, emoji);
  }

  async sendChatMessage(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string
  ): Promise<LiveStreamChatMessage> {
    return this.chatApi.sendChatMessage(
      streamId,
      userId,
      userName,
      userAvatar,
      text,
      (id) => this.getStreamById(id)
    );
  }

  async queryChatMessages(streamId: string): Promise<LiveStreamChatMessage[]> {
    return this.chatApi.queryChatMessages(streamId);
  }

  async getAllStreams(): Promise<LiveStream[]> {
    return this.streamsApi.getAllStreams();
  }
}
