/**
 * Go Live (Streaming) Data Models
 * As specified in the feature pack
 */

export type LiveStreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LiveStreamCategory =
  | 'general'
  | 'training'
  | 'health'
  | 'entertainment'
  | 'education'
  | 'adoption'
  | 'community';

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  title: string;
  category: LiveStreamCategory;
  description?: string;
  roomId: string; // LiveKit room name: live:<userId>
  status: LiveStreamStatus;
  allowChat: boolean;
  maxDuration?: number; // Minutes
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  viewerCount: number;
  peakViewerCount: number;
  reactionsCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  vodUrl?: string; // VOD URL if recording enabled
  posterUrl?: string; // Poster image for VOD
}

export interface LiveStreamViewer {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
  leftAt?: string;
  reactionsSent: number;
}

export interface LiveStreamReaction {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: '❤️' | '👏' | '🔥' | '😊' | '🎉';
  createdAt: string;
}

export interface LiveStreamChatMessage {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  deletedAt?: string;
  banned: boolean;
}

export interface CreateLiveStreamData {
  title: string;
  category: LiveStreamCategory;
  description?: string;
  allowChat: boolean;
  maxDuration?: number;
  scheduledAt?: string;
}

export interface LiveStreamFilters {
  category?: LiveStreamCategory[];
  status?: LiveStreamStatus[];
  hostId?: string;
  sortBy?: 'recent' | 'popular' | 'viewers';
  cursor?: string;
  limit?: number;
}
