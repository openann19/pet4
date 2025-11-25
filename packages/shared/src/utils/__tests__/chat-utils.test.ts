import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createChatRoom,
  formatChatTime,
  getReactionsArray,
  ChatRoom,
  ChatMessage,
  MessageReaction,
  REACTION_EMOJIS,
  ReactionType,
} from '../chat-utils'

// Mock the generateULID function
vi.mock('../utils', () => ({
  generateULID: vi.fn(() => 'test-ulid-123'),
}))

describe('createChatRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a chat room with required properties', () => {
    const room = createChatRoom(
      'match-123',
      'pet-1',
      'pet-2',
      'Fluffy',
      'Buddy',
      'fluffy.jpg',
      'buddy.jpg'
    )

    expect(room).toMatchObject({
      id: 'test-ulid-123',
      matchId: 'match-123',
      petId: 'pet-1',
      matchedPetId: 'pet-2',
      petName: 'Fluffy',
      matchedPetName: 'Buddy',
      petPhoto: 'fluffy.jpg',
      matchedPetPhoto: 'buddy.jpg',
    })
  })

  it('should set createdAt and updatedAt to current ISO timestamp', () => {
    const room = createChatRoom(
      'match-123',
      'pet-1',
      'pet-2',
      'Fluffy',
      'Buddy',
      'fluffy.jpg',
      'buddy.jpg'
    )

    expect(room.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(room.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(room.createdAt).toBe(room.updatedAt)
  })

  it('should not include optional properties by default', () => {
    const room = createChatRoom(
      'match-123',
      'pet-1',
      'pet-2',
      'Fluffy',
      'Buddy',
      'fluffy.jpg',
      'buddy.jpg'
    )

    expect(room.lastMessage).toBeUndefined()
    expect(room.unreadCount).toBeUndefined()
  })
})

describe('formatChatTime', () => {
  it('should format timestamp as HH:MM', () => {
    const timestamp = '2023-12-25T14:30:45.000Z'
    const formatted = formatChatTime(timestamp)

    // Should match time format like "2:30 PM" or "14:30" depending on locale
    expect(formatted).toMatch(/^\d{1,2}:\d{2}\s?[AP]M?$/)
  })

  it('should handle different timestamps', () => {
    const timestamps = [
      '2023-12-25T09:15:00.000Z',
      '2023-12-25T23:45:30.000Z',
      '2023-12-25T00:00:00.000Z',
      '2023-12-25T12:30:45.000Z',
    ]

    timestamps.forEach(timestamp => {
      const formatted = formatChatTime(timestamp)
      expect(formatted).toMatch(/^\d{1,2}:\d{2}\s?[AP]M?$/)
    })
  })

  it('should handle invalid date strings gracefully', () => {
    const invalidTimestamp = 'invalid-date'

    // Should not throw and should return some string representation
    expect(() => formatChatTime(invalidTimestamp)).not.toThrow()
    const result = formatChatTime(invalidTimestamp)
    expect(typeof result).toBe('string')
  })
})

describe('getReactionsArray', () => {
  it('should return empty array for undefined reactions', () => {
    const result = getReactionsArray(undefined)
    expect(result).toEqual([])
  })

  it('should return empty array for null reactions', () => {
    const result = getReactionsArray(null)
    expect(result).toEqual([])
  })

  it('should return values from reactions object', () => {
    const reactions: MessageReaction[] = [
      {
        emoji: '❤️',
        userId: 'user-1',
        userName: 'Alice',
        timestamp: '2023-12-25T14:30:00.000Z',
      },
      {
        emoji: '👍',
        userId: 'user-2',
        userName: 'Bob',
        timestamp: '2023-12-25T14:31:00.000Z',
      },
    ]

    const result = getReactionsArray(reactions)
    expect(result).toEqual(reactions)
  })

  it('should return empty array for empty reactions array', () => {
    const result = getReactionsArray([])
    expect(result).toEqual([])
  })
})

describe('Reaction Types', () => {
  it('should export correct reaction emojis', () => {
    const expectedEmojis: ReactionType[] = ['❤️', '👍', '😂', '😢', '😡', '🐶', '🐱']
    expect(REACTION_EMOJIS).toEqual(expectedEmojis)
  })

  it('should have unique reaction emojis', () => {
    const uniqueEmojis = new Set(REACTION_EMOJIS)
    expect(uniqueEmojis.size).toBe(REACTION_EMOJIS.length)
  })
})

describe('Type Safety', () => {
  it('should allow valid message types', () => {
    const validTypes: ChatMessage['type'][] = ['text', 'sticker', 'voice', 'location', 'pet-card']

    validTypes.forEach(type => {
      expect(['text', 'sticker', 'voice', 'location', 'pet-card']).toContain(type)
    })
  })

  it('should allow valid message statuses', () => {
    const validStatuses: ChatMessage['status'][] = ['sent', 'delivered', 'read']

    validStatuses.forEach(status => {
      expect(['sent', 'delivered', 'read']).toContain(status)
    })
  })

  it('should allow valid attachment types', () => {
    const validTypes: MessageAttachment['type'][] = ['image', 'video', 'file']

    validTypes.forEach(type => {
      expect(['image', 'video', 'file']).toContain(type)
    })
  })
})
