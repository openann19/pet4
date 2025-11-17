import { generateULID } from './utils';
import type {
  Story,
  StoryHighlight,
  CollaborativeStory,
  StoryAnalytics,
  StoryView,
} from '@petspark/shared';

export function createStory(
  userId: string,
  userName: string,
  petId: string,
  petName: string,
  petPhoto: string,
  mediaUrl: string,
  type: Story['type'],
  visibility: Story['visibility'],
  userAvatar?: string
): Story {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    id: generateULID(),
    userId,
    userName,
    ...(userAvatar ? { userAvatar } : {}),
    petId,
    petName,
    petPhoto,
    type,
    mediaUrl,
    duration: type === 'photo' ? 5 : 15,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    visibility,
    viewCount: 0,
    views: [],
    reactions: [],
  };
}

export function createStoryHighlight(
  userId: string,
  petId: string,
  title: string,
  coverImage: string,
  stories: Story[]
): StoryHighlight {
  return {
    id: generateULID(),
    userId,
    petId,
    title,
    coverImage,
    stories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: false,
  };
}

export function createCollaborativeStory(
  creatorId: string,
  creatorName: string,
  title: string,
  description: string,
  maxParticipants = 5
): CollaborativeStory {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    id: generateULID(),
    title,
    description,
    creatorId,
    creatorName,
    participants: [],
    stories: [],
    status: 'active',
    maxParticipants,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function isStoryExpired(story: Story): boolean {
  return new Date(story.expiresAt) < new Date();
}

export function filterActiveStories(stories: Story[]): Story[] {
  if (!Array.isArray(stories)) return [];
  return stories.filter((s) => !isStoryExpired(s));
}

export function groupStoriesByUser(stories: Story[]): Map<string, Story[]> {
  const grouped = new Map<string, Story[]>();

  if (!Array.isArray(stories)) return grouped;

  stories.forEach((story) => {
    const userStories = grouped.get(story.userId) ?? [];
    userStories.push(story);
    grouped.set(story.userId, userStories);
  });

  return grouped;
}

export function calculateStoryAnalytics(story: Story): StoryAnalytics {
  const totalViews = story.views.length;
  const uniqueViews = new Set(story.views.map((v) => v.userId)).size;
  const completedViews = story.views.filter((v) => v.completedView).length;
  const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

  const totalWatchTime = story.views.reduce((sum, v) => sum + v.viewDuration, 0);
  const averageWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;

  const reactionCounts: Record<string, number> = {};
  story.reactions.forEach((reaction) => {
    reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] ?? 0) + 1;
  });

  const viewsByHour = calculateViewsByHour(story.views);
  const geographicReach = calculateGeographicReach(story.views);

  const interactions = story.reactions.length + story.views.filter((v) => v.completedView).length;
  const engagementRate = totalViews > 0 ? (interactions / totalViews) * 100 : 0;

  return {
    storyId: story.id,
    totalViews,
    uniqueViews,
    completionRate,
    averageWatchTime,
    reactions: reactionCounts,
    viewsByHour,
    geographicReach,
    engagementRate,
    shareCount: 0,
  };
}

function calculateViewsByHour(views: StoryView[]): { hour: number; views: number }[] {
  const hourCounts: Record<number, number> = {};

  views.forEach((view) => {
    const hour = new Date(view.viewedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  });

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    views: hourCounts[i] ?? 0,
  }));
}

function calculateGeographicReach(
  views: StoryView[]
): { country: string; city?: string; viewCount: number }[] {
  return [
    {
      country: 'Unknown',
      viewCount: views.length,
    },
  ];
}

export function formatStoryTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getStoryProgress(currentIndex: number, totalStories: number): number {
  return ((currentIndex + 1) / totalStories) * 100;
}

export function canViewStory(story: Story, currentUserId: string, isMatch: boolean): boolean {
  if (story.userId === currentUserId) return true;

  switch (story.visibility) {
    case 'everyone':
      return true;
    case 'matches-only':
      return isMatch;
    case 'close-friends':
      return false;
    default:
      return false;
  }
}

export function addStoryView(
  story: Story,
  userId: string,
  userName: string,
  viewDuration: number,
  completedView: boolean,
  userAvatar?: string
): Story {
  const existingViewIndex = story.views.findIndex((v) => v.userId === userId);

  const newView: StoryView = {
    userId,
    userName,
    ...(userAvatar ? { userAvatar } : {}),
    viewedAt: new Date().toISOString(),
    viewDuration,
    completedView,
  };

  if (existingViewIndex >= 0) {
    const updatedViews = [...story.views];
    updatedViews[existingViewIndex] = newView;
    return {
      ...story,
      views: updatedViews,
      viewCount: story.views.length,
    };
  }

  return {
    ...story,
    views: [...story.views, newView],
    viewCount: story.views.length + 1,
  };
}

export const STORY_FONTS = [
  { id: 'classic', name: 'Classic', fontFamily: 'Inter' },
  { id: 'modern', name: 'Modern', fontFamily: 'system-ui' },
  { id: 'neon', name: 'Neon', fontFamily: 'cursive' },
  { id: 'typewriter', name: 'Typewriter', fontFamily: 'monospace' },
  { id: 'bold', name: 'Bold', fontFamily: 'Inter', fontWeight: 'bold' },
];

export const STORY_COLORS = [
  '#FFFFFF',
  '#000000',
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6BCF7F',
  '#B721FF',
  '#21D4FD',
  '#FF9CEE',
  '#FFA07A',
];
