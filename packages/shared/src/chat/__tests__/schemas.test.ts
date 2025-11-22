/**
 * Chat Schemas Tests - 100% Coverage
 * 
 * Tests Zod schema validation for all chat types
 */

import { describe, it, expect } from 'vitest'
import {
  messageTypeSchema,
  messageStatusSchema,
  reactionTypeSchema,
  messageMetadataSchema,
  messageAttachmentSchema,
  messageReactionSchema,
  messageSchema,
  chatRoomSchema,
  readReceiptSchema,
  typingIndicatorSchema,
  messageReportSchema,
  sendMessageRequestSchema,
  addReactionRequestSchema,
  removeReactionRequestSchema,
  markAsReadRequestSchema,
  messagesResponseSchema,
  chatRoomsResponseSchema,
} from '../schemas'

describe('Chat Schemas', () => {
  describe('messageTypeSchema', () => {
    it('should validate valid message types', () => {
      const validTypes = ['text', 'image', 'video', 'voice', 'location', 'sticker', 'pet-card']
      validTypes.forEach((type) => {
        expect(() => messageTypeSchema.parse(type)).not.toThrow()
      })
    })

    it('should reject invalid message types', () => {
      expect(() => messageTypeSchema.parse('invalid')).toThrow()
      expect(() => messageTypeSchema.parse('')).toThrow()
      expect(() => messageTypeSchema.parse(null)).toThrow()
    })
  })

  describe('messageStatusSchema', () => {
    it('should validate valid message statuses', () => {
      const validStatuses = ['sending', 'sent', 'delivered', 'read', 'failed']
      validStatuses.forEach((status) => {
        expect(() => messageStatusSchema.parse(status)).not.toThrow()
      })
    })

    it('should reject invalid message statuses', () => {
      expect(() => messageStatusSchema.parse('invalid')).toThrow()
    })
  })

  describe('reactionTypeSchema', () => {
    it('should validate valid reaction types', () => {
      const validReactions = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐']
      validReactions.forEach((reaction) => {
        expect(() => reactionTypeSchema.parse(reaction)).not.toThrow()
      })
    })

    it('should reject invalid reaction types', () => {
      expect(() => reactionTypeSchema.parse('😊')).toThrow()
      expect(() => reactionTypeSchema.parse('invalid')).toThrow()
    })
  })

  describe('messageMetadataSchema', () => {
    it('should validate empty metadata', () => {
      expect(() => messageMetadataSchema.parse({})).not.toThrow()
    })

    it('should validate translation metadata', () => {
      const metadata = {
        translation: {
          originalLang: 'en',
          translatedText: 'Hello',
          targetLang: 'es',
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).not.toThrow()
    })

    it('should validate media metadata', () => {
      const metadata = {
        media: {
          url: 'https://example.com/image.jpg',
          thumbnail: 'https://example.com/thumb.jpg',
          width: 1920,
          height: 1080,
          duration: 30,
          size: 1024000,
          mimeType: 'image/jpeg',
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).not.toThrow()
    })

    it('should validate location metadata', () => {
      const metadata = {
        location: {
          lat: 40.7128,
          lng: -74.0060,
          address: 'New York, NY',
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).not.toThrow()
    })

    it('should reject invalid location coordinates', () => {
      const metadata = {
        location: {
          lat: 100, // Invalid: > 90
          lng: -74.0060,
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).toThrow()
    })

    it('should validate voice note metadata', () => {
      const metadata = {
        voiceNote: {
          waveform: [0.1, 0.5, 0.8],
          duration: 5.5,
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).not.toThrow()
    })

    it('should reject negative duration', () => {
      const metadata = {
        voiceNote: {
          waveform: [],
          duration: -1,
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).toThrow()
    })

    it('should validate sticker metadata', () => {
      const metadata = {
        sticker: {
          id: 'sticker-1',
          pack: 'default',
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).not.toThrow()
    })

    it('should validate pet card metadata', () => {
      const metadata = {
        petCard: {
          petId: 'pet-1',
          petName: 'Fluffy',
          petPhoto: 'https://example.com/pet.jpg',
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).not.toThrow()
    })

    it('should reject invalid URLs', () => {
      const metadata = {
        media: {
          url: 'not-a-url',
        },
      }
      expect(() => messageMetadataSchema.parse(metadata)).toThrow()
    })

    it('should reject extra properties', () => {
      const metadata = {
        extraProperty: 'value',
      }
      expect(() => messageMetadataSchema.parse(metadata)).toThrow()
    })
  })

  describe('messageAttachmentSchema', () => {
    it('should validate valid attachment', () => {
      const attachment = {
        id: 'att-1',
        type: 'photo',
        url: 'https://example.com/image.jpg',
      }
      expect(() => messageAttachmentSchema.parse(attachment)).not.toThrow()
    })

    it('should validate attachment with optional fields', () => {
      const attachment = {
        id: 'att-1',
        type: 'video',
        url: 'https://example.com/video.mp4',
        thumbnail: 'https://example.com/thumb.jpg',
        name: 'video.mp4',
        size: 1024000,
        duration: 30,
        mimeType: 'video/mp4',
      }
      expect(() => messageAttachmentSchema.parse(attachment)).not.toThrow()
    })

    it('should reject invalid attachment type', () => {
      const attachment = {
        id: 'att-1',
        type: 'invalid',
        url: 'https://example.com/file',
      }
      expect(() => messageAttachmentSchema.parse(attachment)).toThrow()
    })

    it('should reject negative size', () => {
      const attachment = {
        id: 'att-1',
        type: 'photo',
        url: 'https://example.com/image.jpg',
        size: -1,
      }
      expect(() => messageAttachmentSchema.parse(attachment)).toThrow()
    })
  })

  describe('messageReactionSchema', () => {
    it('should validate valid reaction', () => {
      const reaction = {
        emoji: '❤️',
      }
      expect(() => messageReactionSchema.parse(reaction)).not.toThrow()
    })

    it('should validate reaction with optional fields', () => {
      const reaction = {
        emoji: '❤️',
        userId: 'user-1',
        userName: 'John',
        userAvatar: 'https://example.com/avatar.jpg',
        timestamp: new Date().toISOString(),
        userIds: ['user-1', 'user-2'],
        count: 2,
      }
      expect(() => messageReactionSchema.parse(reaction)).not.toThrow()
    })

    it('should reject negative count', () => {
      const reaction = {
        emoji: '❤️',
        count: -1,
      }
      expect(() => messageReactionSchema.parse(reaction)).toThrow()
    })
  })

  describe('messageSchema', () => {
    it('should validate valid message', () => {
      const message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        createdAt: new Date().toISOString(),
      }
      expect(() => messageSchema.parse(message)).not.toThrow()
    })

    it('should validate message with all optional fields', () => {
      const message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        senderName: 'John',
        senderAvatar: 'https://example.com/avatar.jpg',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        timestamp: new Date().toISOString(),
        attachments: [],
        metadata: {},
        reactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
        deletedFor: ['user-1'],
      }
      expect(() => messageSchema.parse(message)).not.toThrow()
    })

    it('should reject message with missing required fields', () => {
      const message = {
        id: 'msg-1',
        // Missing roomId, senderId, etc.
      }
      expect(() => messageSchema.parse(message)).toThrow()
    })

    it('should validate reactions as array', () => {
      const message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        reactions: [
          {
            emoji: '❤️',
            userId: 'user-2',
          },
        ],
        createdAt: new Date().toISOString(),
      }
      expect(() => messageSchema.parse(message)).not.toThrow()
    })

    it('should validate reactions as record', () => {
      const message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        reactions: {
          '❤️': ['user-2', 'user-3'],
        },
        createdAt: new Date().toISOString(),
      }
      expect(() => messageSchema.parse(message)).not.toThrow()
    })
  })

  describe('chatRoomSchema', () => {
    it('should validate valid chat room', () => {
      const room = {
        id: 'room-1',
        participantIds: ['user-1', 'user-2'],
        type: 'direct',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(() => chatRoomSchema.parse(room)).not.toThrow()
    })

    it('should reject room with less than 2 participants', () => {
      const room = {
        id: 'room-1',
        participantIds: ['user-1'],
        type: 'direct',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(() => chatRoomSchema.parse(room)).toThrow()
    })

    it('should validate unreadCount as number', () => {
      const room = {
        id: 'room-1',
        participantIds: ['user-1', 'user-2'],
        type: 'direct',
        unreadCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(() => chatRoomSchema.parse(room)).not.toThrow()
    })

    it('should validate unreadCount as record', () => {
      const room = {
        id: 'room-1',
        participantIds: ['user-1', 'user-2'],
        type: 'direct',
        unreadCount: {
          'user-1': 5,
          'user-2': 3,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(() => chatRoomSchema.parse(room)).not.toThrow()
    })
  })

  describe('readReceiptSchema', () => {
    it('should validate valid read receipt', () => {
      const receipt = {
        userId: 'user-1',
        messageId: 'msg-1',
        roomId: 'room-1',
        readAt: new Date().toISOString(),
      }
      expect(() => readReceiptSchema.parse(receipt)).not.toThrow()
    })
  })

  describe('typingIndicatorSchema', () => {
    it('should validate valid typing indicator', () => {
      const indicator = {
        userId: 'user-1',
        roomId: 'room-1',
        startedAt: new Date().toISOString(),
      }
      expect(() => typingIndicatorSchema.parse(indicator)).not.toThrow()
    })
  })

  describe('messageReportSchema', () => {
    it('should validate valid message report', () => {
      const report = {
        id: 'report-1',
        messageId: 'msg-1',
        roomId: 'room-1',
        reportedBy: 'user-1',
        reportedUserId: 'user-2',
        reason: 'spam',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      expect(() => messageReportSchema.parse(report)).not.toThrow()
    })

    it('should validate report with optional fields', () => {
      const report = {
        id: 'report-1',
        messageId: 'msg-1',
        roomId: 'room-1',
        reportedBy: 'user-1',
        reportedUserId: 'user-2',
        reason: 'harassment',
        description: 'Inappropriate content',
        status: 'reviewed',
        reviewedBy: 'admin-1',
        reviewedAt: new Date().toISOString(),
        action: 'warning',
        createdAt: new Date().toISOString(),
      }
      expect(() => messageReportSchema.parse(report)).not.toThrow()
    })
  })

  describe('sendMessageRequestSchema', () => {
    it('should validate valid send message request', () => {
      const request = {
        roomId: 'room-1',
        content: 'Hello',
      }
      expect(() => sendMessageRequestSchema.parse(request)).not.toThrow()
    })

    it('should default type to text', () => {
      const request = {
        roomId: 'room-1',
        content: 'Hello',
      }
      const parsed = sendMessageRequestSchema.parse(request)
      expect(parsed.type).toBe('text')
    })

    it('should reject empty content', () => {
      const request = {
        roomId: 'room-1',
        content: '',
      }
      expect(() => sendMessageRequestSchema.parse(request)).toThrow()
    })
  })

  describe('addReactionRequestSchema', () => {
    it('should validate valid add reaction request', () => {
      const request = {
        roomId: 'room-1',
        messageId: 'msg-1',
        emoji: '❤️',
      }
      expect(() => addReactionRequestSchema.parse(request)).not.toThrow()
    })
  })

  describe('removeReactionRequestSchema', () => {
    it('should validate valid remove reaction request', () => {
      const request = {
        roomId: 'room-1',
        messageId: 'msg-1',
        emoji: '❤️',
      }
      expect(() => removeReactionRequestSchema.parse(request)).not.toThrow()
    })
  })

  describe('markAsReadRequestSchema', () => {
    it('should validate valid mark as read request', () => {
      const request = {
        roomId: 'room-1',
        messageId: 'msg-1',
      }
      expect(() => markAsReadRequestSchema.parse(request)).not.toThrow()
    })
  })

  describe('messagesResponseSchema', () => {
    it('should validate valid messages response', () => {
      const response = {
        items: [],
      }
      expect(() => messagesResponseSchema.parse(response)).not.toThrow()
    })

    it('should validate response with optional fields', () => {
      const response = {
        items: [],
        cursor: 'cursor-1',
        hasMore: true,
      }
      expect(() => messagesResponseSchema.parse(response)).not.toThrow()
    })
  })

  describe('chatRoomsResponseSchema', () => {
    it('should validate valid chat rooms response', () => {
      const response = {
        items: [],
      }
      expect(() => chatRoomsResponseSchema.parse(response)).not.toThrow()
    })

    it('should validate response with optional fields', () => {
      const response = {
        items: [],
        cursor: 'cursor-1',
        hasMore: true,
      }
      expect(() => chatRoomsResponseSchema.parse(response)).not.toThrow()
    })
  })
})

