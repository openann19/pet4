/**
 * Stories Types
 *
 * Shared types for stories system
 */

export type StoryType = 'image' | 'video' | 'text';

export type StoryVisibility = 'public' | 'friends' | 'private';

export interface StoryView {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  viewedAt: string;
  viewDuration?: number;
  completed?: boolean;
}

export interface StoryReaction {
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  petId: string;
  petName: string;
  petPhoto: string;
  type: StoryType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  createdAt: string;
  expiresAt: string;
  visibility: StoryVisibility;
  viewCount: number;
  views: StoryView[];
  reactions: StoryReaction[];
}

export interface StoryHighlight {
  id: string;
  userId: string;
  petId: string;
  title: string;
  coverImage: string;
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryRequest {
  petId: string;
  type: StoryType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  visibility: StoryVisibility;
  templateId?: string;
}

export interface CreateStoryResponse {
  story: Story;
}

export interface GetStoriesResponse {
  stories: Story[];
}

export interface GetHighlightsResponse {
  highlights: StoryHighlight[];
}

