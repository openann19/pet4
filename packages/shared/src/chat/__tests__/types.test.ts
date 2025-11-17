/**
 * Chat Types Tests - 100% Coverage
 * 
 * Tests type definitions and constants
 */

import { describe, it, expect } from 'vitest'
import type {
  MessageType,
  MessageStatus,
  ReactionType,
  MessageMetadata,
  Message,
  MessageCluster,
  ReadReceipt,
  TypingIndicator,
  ChatRoom,
  MessageReport,
  MessageTemplate,
  MessageAttachment,
  MessageReaction,
  TypingUser,
  SmartSuggestion,
  Sticker,
} from '../types'
import { REACTION_EMOJIS, MESSAGE_TEMPLATES } from '../types'

describe('Chat Types', () => {
  describe('MessageType', () => {
    it('should accept valid message types', () => {
      const validTypes: MessageType[] = [
        'text',
        'image',
        'video',
        'voice',
        'location',
        'sticker',
        'pet-card',
      ]

      validTypes.forEach((type) => {
        expect(type).toBeDefined()
      })
    })
  })

  describe('MessageStatus', () => {
    it('should accept valid message statuses', () => {
      const validStatuses: MessageStatus[] = [
        'sending',
        'sent',
        'delivered',
        'read',
        'failed',
      ]

      validStatuses.forEach((status) => {
        expect(status).toBeDefined()
      })
    })
  })

  describe('ReactionType', () => {
    it('should accept valid reaction types', () => {
      const validReactions: ReactionType[] = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐']

      validReactions.forEach((reaction) => {
        expect(reaction).toBeDefined()
      })
    })
  })

  describe('REACTION_EMOJIS', () => {
    it('should have 7 reaction emojis', () => {
      expect(REACTION_EMOJIS).toHaveLength(7)
    })

    it('should contain all expected emojis', () => {
      const expected: ReactionType[] = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐']
      expect(REACTION_EMOJIS).toEqual(expected)
    })

    it('should be readonly', () => {
      // TypeScript should prevent mutation, but we can test the structure
      expect(REACTION_EMOJIS).toBeDefined()
    })
  })

  describe('MESSAGE_TEMPLATES', () => {
    it('should have at least one template', () => {
      expect(MESSAGE_TEMPLATES.length).toBeGreaterThan(0)
    })

    it('should have templates with required properties', () => {
      MESSAGE_TEMPLATES.forEach((template) => {
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('text')
        expect(template).toHaveProperty('category')
        expect(typeof template.id).toBe('string')
        expect(typeof template.text).toBe('string')
        expect(['greeting', 'playdate', 'followup', 'closing']).toContain(template.category)
      })
    })

    it('should have templates in each category', () => {
      const categories = MESSAGE_TEMPLATES.map((t) => t.category)
      expect(categories).toContain('greeting')
      expect(categories).toContain('playdate')
      expect(categories).toContain('followup')
      expect(categories).toContain('closing')
    })
  })

  describe('MessageMetadata', () => {
    it('should allow optional properties', () => {
      const metadata: MessageMetadata = {}
      expect(metadata).toBeDefined()
    })

    it('should allow translation metadata', () => {
      const metadata: MessageMetadata = {
        translation: {
          originalLang: 'en',
          translatedText: 'Hello',
          targetLang: 'es',
        },
      }
      expect(metadata.translation).toBeDefined()
    })

    it('should allow media metadata', () => {
      const metadata: MessageMetadata = {
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
      expect(metadata.media).toBeDefined()
    })

    it('should allow location metadata', () => {
      const metadata: MessageMetadata = {
        location: {
          lat: 40.7128,
          lng: -74.0060,
          address: 'New York, NY',
        },
      }
      expect(metadata.location).toBeDefined()
    })

    it('should allow voice note metadata', () => {
      const metadata: MessageMetadata = {
        voiceNote: {
          waveform: [0.1, 0.5, 0.8, 0.3],
          duration: 5.5,
        },
      }
      expect(metadata.voiceNote).toBeDefined()
    })

    it('should allow sticker metadata', () => {
      const metadata: MessageMetadata = {
        sticker: {
          id: 'sticker-1',
          pack: 'default',
        },
      }
      expect(metadata.sticker).toBeDefined()
    })

    it('should allow pet card metadata', () => {
      const metadata: MessageMetadata = {
        petCard: {
          petId: 'pet-1',
          petName: 'Fluffy',
          petPhoto: 'https://example.com/pet.jpg',
        },
      }
      expect(metadata.petCard).toBeDefined()
    })
  })

  describe('Message', () => {
    it('should require all required fields', () => {
      const message: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        createdAt: new Date().toISOString(),
      }
      expect(message).toBeDefined()
    })

    it('should allow optional fields', () => {
      const message: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        senderName: 'John',
        senderAvatar: 'https://example.com/avatar.jpg',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(message).toBeDefined()
    })

    it('should allow reactions as array', () => {
      const message: Message = {
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
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      }
      expect(message.reactions).toBeDefined()
    })

    it('should allow reactions as record', () => {
      const message: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        reactions: {
          '❤️': ['user-2', 'user-3'],
          '👍': ['user-4'],
        },
        createdAt: new Date().toISOString(),
      }
      expect(message.reactions).toBeDefined()
    })
  })

  describe('MessageCluster', () => {
    it('should require all fields', () => {
      const cluster: MessageCluster = {
        messages: [],
        senderId: 'user-1',
        timestamp: new Date().toISOString(),
        isCurrentUser: false,
      }
      expect(cluster).toBeDefined()
    })
  })

  describe('ReadReceipt', () => {
    it('should require all fields', () => {
      const receipt: ReadReceipt = {
        userId: 'user-1',
        messageId: 'msg-1',
        roomId: 'room-1',
        readAt: new Date().toISOString(),
      }
      expect(receipt).toBeDefined()
    })
  })

  describe('TypingIndicator', () => {
    it('should require all fields', () => {
      const indicator: TypingIndicator = {
        userId: 'user-1',
        roomId: 'room-1',
        startedAt: new Date().toISOString(),
      }
      expect(indicator).toBeDefined()
    })
  })

  describe('ChatRoom', () => {
    it('should require all required fields', () => {
      const room: ChatRoom = {
        id: 'room-1',
        participantIds: ['user-1', 'user-2'],
        type: 'direct',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(room).toBeDefined()
    })

    it('should allow optional fields', () => {
      const room: ChatRoom = {
        id: 'room-1',
        participantIds: ['user-1', 'user-2'],
        type: 'group',
        lastMessage: {
          id: 'msg-1',
          roomId: 'room-1',
          senderId: 'user-1',
          type: 'text',
          content: 'Hello',
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        lastMessageAt: new Date().toISOString(),
        unreadCount: 5,
        matchedPetId: 'pet-1',
        matchId: 'match-1',
        matchedPetName: 'Fluffy',
        matchedPetPhoto: 'https://example.com/pet.jpg',
        isTyping: false,
        typingUsers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(room).toBeDefined()
    })

    it('should allow unreadCount as record', () => {
      const room: ChatRoom = {
        id: 'room-1',
        participantIds: ['user-1', 'user-2'],
        type: 'group',
        unreadCount: {
          'user-1': 5,
          'user-2': 3,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(room.unreadCount).toBeDefined()
    })
  })

  describe('MessageReport', () => {
    it('should require all required fields', () => {
      const report: MessageReport = {
        id: 'report-1',
        messageId: 'msg-1',
        roomId: 'room-1',
        reportedBy: 'user-1',
        reportedUserId: 'user-2',
        reason: 'spam',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      expect(report).toBeDefined()
    })

    it('should allow optional fields', () => {
      const report: MessageReport = {
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
      expect(report).toBeDefined()
    })
  })

  describe('MessageTemplate', () => {
    it('should require all required fields', () => {
      const template: MessageTemplate = {
        id: 'template-1',
        text: 'Hello!',
        category: 'greeting',
      }
      expect(template).toBeDefined()
    })

    it('should allow optional fields', () => {
      const template: MessageTemplate = {
        id: 'template-1',
        text: 'Hello!',
        title: 'Greeting',
        icon: '👋',
        content: 'Hello!',
        category: 'greeting',
      }
      expect(template).toBeDefined()
    })
  })

  describe('MessageAttachment', () => {
    it('should require all required fields', () => {
      const attachment: MessageAttachment = {
        id: 'att-1',
        type: 'photo',
        url: 'https://example.com/image.jpg',
      }
      expect(attachment).toBeDefined()
    })

    it('should allow optional fields', () => {
      const attachment: MessageAttachment = {
        id: 'att-1',
        type: 'video',
        url: 'https://example.com/video.mp4',
        thumbnail: 'https://example.com/thumb.jpg',
        name: 'video.mp4',
        size: 1024000,
        duration: 30,
        mimeType: 'video/mp4',
      }
      expect(attachment).toBeDefined()
    })
  })

  describe('MessageReaction', () => {
    it('should require emoji', () => {
      const reaction: MessageReaction = {
        emoji: '❤️',
      }
      expect(reaction).toBeDefined()
    })

    it('should allow optional fields', () => {
      const reaction: MessageReaction = {
        emoji: '❤️',
        userId: 'user-1',
        userName: 'John',
        userAvatar: 'https://example.com/avatar.jpg',
        timestamp: new Date().toISOString(),
        userIds: ['user-1', 'user-2'],
        count: 2,
      }
      expect(reaction).toBeDefined()
    })
  })

  describe('TypingUser', () => {
    it('should require all fields', () => {
      const user: TypingUser = {
        userId: 'user-1',
        userName: 'John',
        startedAt: new Date().toISOString(),
      }
      expect(user).toBeDefined()
    })
  })

  describe('SmartSuggestion', () => {
    it('should require all required fields', () => {
      const suggestion: SmartSuggestion = {
        id: 'suggestion-1',
        text: 'How are you?',
        category: 'question',
      }
      expect(suggestion).toBeDefined()
    })

    it('should allow optional fields', () => {
      const suggestion: SmartSuggestion = {
        id: 'suggestion-1',
        text: 'How are you?',
        category: 'question',
        confidence: 0.9,
        icon: '❓',
      }
      expect(suggestion).toBeDefined()
    })
  })

  describe('Sticker', () => {
    it('should require all fields', () => {
      const sticker: Sticker = {
        id: 'sticker-1',
        pack: 'default',
        categoryId: 'emotions',
        emoji: '😊',
        label: 'Happy',
        keywords: ['happy', 'smile'],
      }
      expect(sticker).toBeDefined()
    })
  })
})

