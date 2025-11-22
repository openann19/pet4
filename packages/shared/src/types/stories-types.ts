export type StoryType = 'photo' | 'video' | 'gif' | 'boomerang'
export type StoryVisibility = 'everyone' | 'matches-only' | 'close-friends'
export type StoryMusicProvider = 'licensed' | 'user'

export interface Story {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  petId: string
  petName: string
  petPhoto: string
  type: StoryType
  mediaType?: StoryType // Alias for type for backward compatibility
  mediaUrl: string
  thumbnailUrl?: string
  caption?: string
  duration: number
  createdAt: string
  expiresAt: string
  visibility: StoryVisibility
  viewCount: number
  views: StoryView[]
  reactions: StoryReaction[]
  template?: StoryTemplate
  music?: StoryMusic
  location?: StoryLocation
  stickers?: StorySticker[]
  textOverlays?: TextOverlay[]
}

export interface StoryView {
  userId: string
  userName: string
  userAvatar?: string
  viewedAt: string
  viewDuration: number
  completedView: boolean
}

export interface StoryReaction {
  userId: string
  userName: string
  userAvatar?: string
  emoji: string
  timestamp: string
}

export interface StoryTemplate {
  id: string
  name: string
  category: string
  layoutType: 'single' | 'collage' | 'split' | 'grid'
  backgroundColor?: string
  backgroundGradient?: string[]
  frame?: string
  overlayEffects?: string[]
}

export interface StoryMusic {
  id: string
  title: string
  artist: string
  provider: StoryMusicProvider
  startTime: number
  duration: number
  coverArt?: string
  previewUrl?: string
}

export interface StoryLocation {
  latitude: number
  longitude: number
  placeName: string
  placeId?: string
  city?: string
  country?: string
}

export interface StorySticker {
  id: string
  type: 'emoji' | 'gif' | 'location' | 'mention' | 'poll' | 'question'
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
}

export interface StoryHighlight {
  id: string
  userId: string
  petId: string
  title: string
  coverImage: string
  stories: Story[]
  createdAt: string
  updatedAt: string
  isPinned: boolean
}

export interface TextOverlay {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: string
  color: string
  backgroundColor?: string
  x: number
  y: number
  rotation: number
  alignment: 'left' | 'center' | 'right'
  animation?: 'fade-in' | 'slide-in' | 'bounce' | 'typewriter'
}

export interface CollaborativeStory {
  id: string
  title: string
  description: string
  creatorId: string
  creatorName: string
  participants: StoryParticipant[]
  stories: Story[]
  status: 'active' | 'completed' | 'archived'
  maxParticipants: number
  createdAt: string
  expiresAt: string
}

export interface StoryParticipant {
  userId: string
  userName: string
  userAvatar?: string
  petId: string
  petName: string
  petPhoto: string
  joinedAt: string
  contributionCount: number
}

export interface StoryAnalytics {
  storyId: string
  totalViews: number
  uniqueViews: number
  completionRate: number
  averageWatchTime: number
  reactions: Record<string, number>
  viewsByHour: { hour: number; views: number }[]
  geographicReach: {
    country: string
    city?: string
    viewCount: number
  }[]
  engagementRate: number
  shareCount: number
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'template-1',
    name: 'Classic',
    category: 'Basic',
    layoutType: 'single',
    backgroundColor: '#ffffff',
  },
  {
    id: 'template-2',
    name: 'Gradient Sunset',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#FF6B6B', '#FFD93D', '#6BCF7F'],
  },
  {
    id: 'template-3',
    name: 'Pet Collage',
    category: 'Layout',
    layoutType: 'collage',
    backgroundColor: '#f5f5f5',
  },
  {
    id: 'template-4',
    name: 'Split Screen',
    category: 'Layout',
    layoutType: 'split',
    backgroundColor: '#000000',
  },
  {
    id: 'template-5',
    name: 'Photo Grid',
    category: 'Layout',
    layoutType: 'grid',
    backgroundColor: '#ffffff',
  },
  {
    id: 'template-6',
    name: 'Neon Vibes',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#B721FF', '#21D4FD'],
  },
]

export const STORY_MUSIC_TRACKS = [
  {
    id: 'music-1',
    title: 'Happy Paws',
    artist: 'Pet Tunes',
    provider: 'licensed' as StoryMusicProvider,
    duration: 30,
    previewUrl: '#',
  },
  {
    id: 'music-2',
    title: 'Playful Day',
    artist: 'Animal Beats',
    provider: 'licensed' as StoryMusicProvider,
    duration: 30,
    previewUrl: '#',
  },
  {
    id: 'music-3',
    title: 'Adventure Time',
    artist: 'Woof Records',
    provider: 'licensed' as StoryMusicProvider,
    duration: 30,
    previewUrl: '#',
  },
]

export const STORY_REACTION_EMOJIS = ['❤️', '😂', '😮', '😍', '🔥', '👏', '🐾', '💯']
