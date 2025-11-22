/**
 * Chat Utils Tests - 100% Coverage
 * 
 * Tests chat utility functions including:
 * - generateMessageId
 * - CHAT_STICKERS constant
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { generateMessageId, CHAT_STICKERS } from '../chat-utils'
import type { ChatSticker } from '../chat-utils'

describe('chat-utils', () => {
  describe('generateMessageId', () => {
    it('should generate unique message IDs', () => {
      const id1 = generateMessageId()
      const id2 = generateMessageId()

      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should include timestamp in ID', () => {
      const before = Date.now()
      const id = generateMessageId()
      const after = Date.now()

      const timestamp = parseInt(id.split('_')[1] ?? '0', 10)
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should include UUID portion in ID', () => {
      const id = generateMessageId()
      const parts = id.split('_')

      expect(parts.length).toBe(3)
      expect(parts[0]).toBe('msg')
      expect(parts[2]?.length).toBe(8)
    })

    it('should generate different IDs on subsequent calls', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateMessageId())
      }

      // All IDs should be unique
      expect(ids.size).toBe(100)
    })

    it('should handle rapid successive calls', () => {
      const ids: string[] = []
      for (let i = 0; i < 10; i++) {
        ids.push(generateMessageId())
      }

      // All should be unique
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })
  })

  describe('CHAT_STICKERS', () => {
    it('should have 18 stickers', () => {
      expect(CHAT_STICKERS).toHaveLength(18)
    })

    it('should have all required properties for each sticker', () => {
      CHAT_STICKERS.forEach((sticker: ChatSticker) => {
        expect(sticker).toHaveProperty('id')
        expect(sticker).toHaveProperty('name')
        expect(sticker).toHaveProperty('emoji')
        expect(sticker).toHaveProperty('category')
        expect(typeof sticker.id).toBe('string')
        expect(typeof sticker.name).toBe('string')
        expect(typeof sticker.emoji).toBe('string')
        expect(typeof sticker.category).toBe('string')
      })
    })

    it('should have unique IDs', () => {
      const ids = CHAT_STICKERS.map(s => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(CHAT_STICKERS.length)
    })

    it('should have valid categories', () => {
      const validCategories = ['emotions', 'gestures', 'celebration']
      CHAT_STICKERS.forEach((sticker: ChatSticker) => {
        expect(validCategories).toContain(sticker.category)
      })
    })

    it('should have non-empty emojis', () => {
      CHAT_STICKERS.forEach((sticker: ChatSticker) => {
        expect(sticker.emoji.length).toBeGreaterThan(0)
      })
    })

    it('should have non-empty names', () => {
      CHAT_STICKERS.forEach((sticker: ChatSticker) => {
        expect(sticker.name.length).toBeGreaterThan(0)
      })
    })

    it('should have expected sticker IDs', () => {
      const expectedIds = Array.from({ length: 18 }, (_, i) => `sticker-${i + 1}`)
      const actualIds = CHAT_STICKERS.map(s => s.id)

      expect(actualIds).toEqual(expectedIds)
    })

    it('should have stickers in each category', () => {
      const categories = CHAT_STICKERS.reduce<Record<string, number>>((acc, sticker) => {
        acc[sticker.category] = (acc[sticker.category] ?? 0) + 1
        return acc
      }, {})

      expect(categories.emotions).toBeGreaterThan(0)
      expect(categories.gestures).toBeGreaterThan(0)
      expect(categories.celebration).toBeGreaterThan(0)
    })

    it('should have specific expected stickers', () => {
      const stickerMap = new Map(CHAT_STICKERS.map(s => [s.id, s]))

      expect(stickerMap.get('sticker-1')).toMatchObject({
        name: 'Happy',
        emoji: '😊',
        category: 'emotions',
      })

      expect(stickerMap.get('sticker-6')).toMatchObject({
        name: 'Party',
        emoji: '🎉',
        category: 'celebration',
      })

      expect(stickerMap.get('sticker-4')).toMatchObject({
        name: 'Thumbs Up',
        emoji: '👍',
        category: 'gestures',
      })
    })
  })
})

