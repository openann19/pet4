export type StoryType = 'photo' | 'video' | 'gif' | 'boomerang';
export type StoryVisibility = 'everyone' | 'matches-only' | 'close-friends';
export type StoryMusicProvider = 'licensed' | 'user';

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
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
  template?: StoryTemplate;
  music?: StoryMusic;
  location?: StoryLocation;
  stickers?: StorySticker[];
  textOverlays?: TextOverlay[];
}

export interface StoryView {
  userId: string;
  userName: string;
  userAvatar?: string;
  viewedAt: string;
  viewDuration: number;
  completedView: boolean;
}

export interface StoryReaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: string;
  timestamp: string;
}

export interface StoryTemplate {
  id: string;
  name: string;
  category: string;
  layoutType: 'single' | 'collage' | 'split' | 'grid';
  backgroundColor?: string;
  backgroundGradient?: string[];
  frame?: string;
  overlayEffects?: string[];
}

export interface StoryMusic {
  id: string;
  title: string;
  artist: string;
  provider: StoryMusicProvider;
  startTime: number;
  duration: number;
  coverArt?: string;
  previewUrl?: string;
}

export interface StoryLocation {
  latitude: number;
  longitude: number;
  placeName: string;
  placeId?: string;
  city?: string;
  country?: string;
}

export interface StorySticker {
  id: string;
  type: 'emoji' | 'gif' | 'location' | 'mention' | 'poll' | 'question';
}

export interface StoryHighlight {
  id: string;
  userId: string;
  petId: string;
  title: string;
  coverImage: string;
  stories: Story[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export interface TextOverlay {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  x: number;
  y: number;
  rotation: number;
  alignment: 'left' | 'center' | 'right';
  animation?: 'fade-in' | 'slide-in' | 'bounce' | 'typewriter';
}
