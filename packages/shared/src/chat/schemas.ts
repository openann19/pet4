/**
 * Chat Zod Schemas
 *
 * Zod schemas for validating chat API requests and responses.
 * Provides runtime type safety and parsing.
 */

import { z } from 'zod'

export const messageTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'voice',
  'location',
  'sticker',
  'pet-card',
])

export const messageStatusSchema = z.enum(['sending', 'sent', 'delivered', 'read', 'failed'])

export const reactionTypeSchema = z.enum(['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐'])

export const messageMetadataSchema = z
  .object({
    messageId: z.string().optional(),
    translation: z
      .object({
        originalLang: z.string(),
        translatedText: z.string(),
        targetLang: z.string(),
      })
      .optional(),
    media: z
      .object({
        url: z.string().url(),
        thumbnail: z.string().url().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        duration: z.number().nonnegative().optional(),
        size: z.number().int().nonnegative().optional(),
        mimeType: z.string().optional(),
      })
      .optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        address: z.string().optional(),
      })
      .optional(),
    voiceNote: z
      .object({
        waveform: z.array(z.number()),
        duration: z.number().nonnegative(),
      })
      .optional(),
    sticker: z
      .object({
        id: z.string(),
        pack: z.string(),
      })
      .optional(),
    petCard: z
      .object({
        petId: z.string(),
        petName: z.string(),
        petPhoto: z.string().url().optional(),
      })
      .optional(),
    replyTo: z.string().optional(),
  })
  .strict()

export const messageAttachmentSchema = z
  .object({
    id: z.string(),
    type: z.enum(['photo', 'video', 'voice', 'document']),
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
    name: z.string().optional(),
    size: z.number().int().nonnegative().optional(),
    duration: z.number().nonnegative().optional(),
    mimeType: z.string().optional(),
  })
  .strict()

export const messageReactionSchema = z
  .object({
    emoji: z.string(),
    userId: z.string().optional(),
    userName: z.string().optional(),
    userAvatar: z.string().url().optional(),
    timestamp: z.string().datetime().optional(),
    userIds: z.array(z.string()).optional(),
    count: z.number().int().nonnegative().optional(),
  })
  .strict()

export const messageSchema = z
  .object({
    id: z.string(),
    roomId: z.string(),
    senderId: z.string(),
    senderName: z.string().optional(),
    senderAvatar: z.string().url().optional(),
    type: messageTypeSchema,
    content: z.string(),
    status: messageStatusSchema,
    timestamp: z.string().datetime().optional(),
    attachments: z.array(messageAttachmentSchema).optional(),
    metadata: messageMetadataSchema.optional(),
    reactions: z
      .union([z.array(messageReactionSchema), z.record(reactionTypeSchema, z.array(z.string()))])
      .optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    deletedAt: z.string().datetime().optional(),
    deletedFor: z.array(z.string()).optional(),
  })
  .strict()

export const chatRoomSchema = z
  .object({
    id: z.string(),
    participantIds: z.array(z.string()).min(2),
    type: z.enum(['direct', 'group']),
    lastMessage: messageSchema.optional(),
    lastMessageAt: z.string().datetime().optional(),
    unreadCount: z
      .union([z.record(z.string(), z.number().int().nonnegative()), z.number().int().nonnegative()])
      .optional(),
    matchedPetId: z.string().optional(),
    matchId: z.string().optional(),
    matchedPetName: z.string().optional(),
    matchedPetPhoto: z.string().url().optional(),
    isTyping: z.boolean().optional(),
    typingUsers: z
      .array(
        z.object({
          userId: z.string(),
          userName: z.string(),
          startedAt: z.string().datetime(),
        })
      )
      .optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()

export const readReceiptSchema = z
  .object({
    userId: z.string(),
    messageId: z.string(),
    roomId: z.string(),
    readAt: z.string().datetime(),
  })
  .strict()

export const typingIndicatorSchema = z
  .object({
    userId: z.string(),
    roomId: z.string(),
    startedAt: z.string().datetime(),
  })
  .strict()

export const messageReportSchema = z
  .object({
    id: z.string(),
    messageId: z.string(),
    roomId: z.string(),
    reportedBy: z.string(),
    reportedUserId: z.string(),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
    description: z.string().optional(),
    status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']),
    reviewedBy: z.string().optional(),
    reviewedAt: z.string().datetime().optional(),
    action: z.enum(['warning', 'mute', 'suspend', 'no_action']).optional(),
    createdAt: z.string().datetime(),
  })
  .strict()

// Request schemas
export const sendMessageRequestSchema = z
  .object({
    roomId: z.string(),
    content: z.string().min(1),
    type: messageTypeSchema.default('text'),
    metadata: messageMetadataSchema.optional(),
    attachments: z.array(messageAttachmentSchema).optional(),
    replyTo: z.string().optional(),
  })
  .strict()

export const addReactionRequestSchema = z
  .object({
    roomId: z.string(),
    messageId: z.string(),
    emoji: reactionTypeSchema,
  })
  .strict()

export const removeReactionRequestSchema = z
  .object({
    roomId: z.string(),
    messageId: z.string(),
    emoji: reactionTypeSchema,
  })
  .strict()

export const markAsReadRequestSchema = z
  .object({
    roomId: z.string(),
    messageId: z.string(),
  })
  .strict()

// Response schemas
export const messagesResponseSchema = z
  .object({
    items: z.array(messageSchema),
    cursor: z.string().optional(),
    hasMore: z.boolean().optional(),
  })
  .strict()

export const chatRoomsResponseSchema = z
  .object({
    items: z.array(chatRoomSchema),
    cursor: z.string().optional(),
    hasMore: z.boolean().optional(),
  })
  .strict()

// Type inference from schemas
export type MessageType = z.infer<typeof messageTypeSchema>
export type MessageStatus = z.infer<typeof messageStatusSchema>
export type ReactionType = z.infer<typeof reactionTypeSchema>
export type MessageMetadata = z.infer<typeof messageMetadataSchema>
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>
export type MessageReaction = z.infer<typeof messageReactionSchema>
export type Message = z.infer<typeof messageSchema>
export type ChatRoom = z.infer<typeof chatRoomSchema>
export type ReadReceipt = z.infer<typeof readReceiptSchema>
export type TypingIndicator = z.infer<typeof typingIndicatorSchema>
export type MessageReport = z.infer<typeof messageReportSchema>
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>
export type AddReactionRequest = z.infer<typeof addReactionRequestSchema>
export type RemoveReactionRequest = z.infer<typeof removeReactionRequestSchema>
export type MarkAsReadRequest = z.infer<typeof markAsReadRequestSchema>
export type MessagesResponse = z.infer<typeof messagesResponseSchema>
export type ChatRoomsResponse = z.infer<typeof chatRoomsResponseSchema>
