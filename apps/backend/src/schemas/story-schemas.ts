/**
 * Story Validation Schemas
 *
 * Comprehensive Zod schemas for story-related API endpoints.
 * Aligned with shared types from @petspark/shared.
 */

import { z } from 'zod';

export const storyViewSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string().min(1).max(100),
  userAvatar: z.string().url().optional(),
  viewedAt: z.string().datetime(),
  viewDuration: z.number().int().min(0),
  completedView: z.boolean(),
});

export const storyReactionSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string().min(1).max(100),
  userAvatar: z.string().url().optional(),
  emoji: z.string().min(1).max(10),
  timestamp: z.string().datetime(),
});

export const storyTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  layoutType: z.enum(['single', 'collage', 'split', 'grid']),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundGradient: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
  frame: z.string().optional(),
  overlayEffects: z.array(z.string()).optional(),
});

export const storyMusicSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  provider: z.enum(['licensed', 'user']),
  startTime: z.number().int().min(0),
  duration: z.number().int().positive().max(300),
  coverArt: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
});

export const storyLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeName: z.string().min(1).max(200),
  placeId: z.string().optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const storyStickerSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['emoji', 'gif', 'location', 'mention', 'poll', 'question']),
  content: z.string().min(1).max(500),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
  rotation: z.number().min(-360).max(360),
  scale: z.number().positive().max(5),
});

export const textOverlaySchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
  fontFamily: z.string().min(1).max(100),
  fontSize: z.number().positive().max(200),
  fontWeight: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  rotation: z.number().min(-360).max(360),
  alignment: z.enum(['left', 'center', 'right']),
  animation: z.enum(['fade-in', 'slide-in', 'bounce', 'typewriter']).optional(),
});

export const createStorySchema = z.object({
  petId: z.string().uuid(),
  type: z.enum(['photo', 'video', 'gif', 'boomerang']),
  mediaUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(2000).optional(),
  duration: z.number().int().positive().max(300),
  visibility: z.enum(['everyone', 'matches-only', 'close-friends']),
  template: storyTemplateSchema.optional(),
  music: storyMusicSchema.optional(),
  location: storyLocationSchema.optional(),
  stickers: z.array(storyStickerSchema).max(20).optional(),
  textOverlays: z.array(textOverlaySchema).max(10).optional(),
});

export const updateStorySchema = z.object({
  caption: z.string().max(2000).optional(),
  visibility: z.enum(['everyone', 'matches-only', 'close-friends']).optional(),
  stickers: z.array(storyStickerSchema).max(20).optional(),
  textOverlays: z.array(textOverlaySchema).max(10).optional(),
});

export const storyQuerySchema = z.object({
  petId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  visibility: z.enum(['everyone', 'matches-only', 'close-friends']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  cursor: z.string().optional(),
});

export const storyParamsSchema = z.object({
  storyId: z.string().uuid(),
});

export const storyReactionCreateSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export const storyHighlightCreateSchema = z.object({
  title: z.string().min(1).max(100),
  coverImage: z.string().url(),
  storyIds: z.array(z.string().uuid()).min(1).max(50),
  isPinned: z.boolean().default(false),
});

export const storyHighlightUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  coverImage: z.string().url().optional(),
  storyIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  isPinned: z.boolean().optional(),
});

export const storyHighlightParamsSchema = z.object({
  highlightId: z.string().uuid(),
});

export const collaborativeStoryCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  maxParticipants: z.number().int().positive().max(20).default(10),
  expiresAt: z.string().datetime(),
});

export const collaborativeStoryJoinSchema = z.object({
  petId: z.string().uuid(),
});

export const collaborativeStoryParamsSchema = z.object({
  collaborativeStoryId: z.string().uuid(),
});
