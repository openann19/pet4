import type {
  CreateLiveStreamData,
  LiveStream,
  LiveStreamChatMessage,
  LiveStreamReaction,
  LiveStreamViewer,
} from '@/lib/live-streaming-types';

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
  joinToken: string;
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

