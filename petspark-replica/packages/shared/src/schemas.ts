/**
 * Zod schemas for data validation across PETSPARK applications
 */

import { z } from 'zod';

// Base schemas
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User schemas
export const userSchema = baseEntitySchema.extend({
  email: z.string().email(),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
  displayName: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  verified: z.boolean(),
  premium: z.boolean(),
});

// Pet schemas
export const petTypeSchema = z.enum([
  'dog',
  'cat',
  'bird',
  'rabbit',
  'hamster',
  'fish',
  'reptile',
  'other',
]);

export const petGenderSchema = z.enum(['male', 'female', 'unknown']);

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const petSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(50),
  type: petTypeSchema,
  breed: z.string().max(50).optional(),
  age: z.number().min(0).max(30),
  gender: petGenderSchema,
  weight: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(10),
  owner: userSchema,
  location: locationSchema.optional(),
  tags: z.array(z.string().max(20)).max(20),
  verified: z.boolean(),
});

// Social schemas
export const messageTypeSchema = z.enum(['text', 'image', 'video', 'location']);

export const messageAttachmentSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video', 'file']),
  metadata: z.record(z.unknown()).optional(),
});

export const messageSchema = baseEntitySchema.extend({
  id: z.string().uuid(),
  author: userSchema,
  content: z.string().max(1000),
  type: messageTypeSchema,
  attachments: z.array(messageAttachmentSchema).optional(),
});

export const commentSchema = baseEntitySchema.extend({
  author: userSchema,
  content: z.string().min(1).max(300),
  likes: z.array(z.string().uuid()),
});

export const postSchema = baseEntitySchema.extend({
  author: userSchema,
  content: z.string().max(500),
  images: z.array(z.string().url()).max(10).optional(),
  pet: petSchema.optional(),
  likes: z.array(z.string().uuid()),
  comments: z.array(commentSchema),
  tags: z.array(z.string().max(20)).max(10),
});

export const chatRoomSchema = baseEntitySchema.extend({
  id: z.string().uuid(),
  participants: z.array(userSchema).min(2),
  lastMessage: messageSchema.optional(),
  unreadCounts: z.record(z.number().min(0)),
});

// Discovery schemas
export const discoveryFiltersSchema = z.object({
  petTypes: z.array(petTypeSchema).min(1),
  ageRange: z.tuple([z.number().min(0), z.number().max(30)]),
  distance: z.number().min(100).max(100000),
  location: locationSchema,
  tags: z.array(z.string().max(20)).max(20),
});

// API response schemas
export const apiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    data: dataSchema,
    success: z.boolean(),
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
  });

export const paginatedResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(dataSchema),
    total: z.number().min(0),
    page: z.number().min(1),
    pageSize: z.number().min(1).max(100),
    hasNext: z.boolean(),
  });

// Form schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
  displayName: z.string().min(1).max(50),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const createPetSchema = z.object({
  name: z.string().min(1).max(50),
  type: petTypeSchema,
  breed: z.string().max(50).optional(),
  age: z.number().min(0).max(30),
  gender: petGenderSchema,
  weight: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(10),
  tags: z.array(z.string().max(20)).max(20),
});

export const createPostSchema = z.object({
  content: z.string().max(500),
  images: z.array(z.string().url()).max(10).optional(),
  petId: z.string().uuid().optional(),
  tags: z.array(z.string().max(20)).max(10),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  type: messageTypeSchema.optional(),
  attachments: z.array(messageAttachmentSchema).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const searchSchema = paginationSchema.extend({
  query: z.string().min(1).max(100),
  filters: discoveryFiltersSchema.optional(),
});

// Type inference helpers
export type User = z.infer<typeof userSchema>;
export type Pet = z.infer<typeof petSchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type Message = z.infer<typeof messageSchema>;
export type ChatRoom = z.infer<typeof chatRoomSchema>;
export type Location = z.infer<typeof locationSchema>;
export type DiscoveryFilters = z.infer<typeof discoveryFiltersSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreatePetInput = z.infer<typeof createPetSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
