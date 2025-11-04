/**
 * Enhanced Notification Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnhancedNotificationService } from '../enhanced-notification-service'
import type { User, Match } from '../contracts'

vi.mock('../push-notifications', () => ({
  pushNotifications: {
    showNotification: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

describe('EnhancedNotificationService', () => {
  let service: EnhancedNotificationService

  beforeEach(() => {
    service = new EnhancedNotificationService()
    vi.clearAllMocks()
  })

  describe('notifyMatchCreated', () => {
    it('should send notification to both users', async () => {
      const match: Match = {
        id: 'match-123',
        petAId: 'pet-1',
        petBId: 'pet-2',
        compatibilityScore: 85,
        compatibilityBreakdown: {
          personality: 80,
          interests: 90,
          size: 85,
          age: 80,
          location: 90,
          overall: 85
        },
        status: 'active',
        chatRoomId: 'room-123',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString()
      }

      const userA: User = {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User A',
        roles: ['user'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        lastSeenAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            push: true,
            email: true,
            matches: true,
            messages: true,
            likes: true
          },
          quietHours: null
        }
      }

      const userB: User = {
        ...userA,
        id: 'user-2',
        email: 'user2@example.com',
        displayName: 'User B'
      }

      vi.mocked(window.spark.kv.get).mockResolvedValue([])
      vi.mocked(window.spark.kv.set).mockResolvedValue(undefined)

      await service.notifyMatchCreated(match, userA, userB)

      expect(window.spark.kv.set).toHaveBeenCalled()
    })

    it('should respect quiet hours', async () => {
      const match: Match = {
        id: 'match-123',
        petAId: 'pet-1',
        petBId: 'pet-2',
        compatibilityScore: 85,
        compatibilityBreakdown: {
          personality: 80,
          interests: 90,
          size: 85,
          age: 80,
          location: 90,
          overall: 85
        },
        status: 'active',
        chatRoomId: 'room-123',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString()
      }

      const now = new Date()
      now.setHours(22, 0, 0, 0)

      const userA: User = {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User A',
        roles: ['user'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        lastSeenAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            push: true,
            email: true,
            matches: true,
            messages: true,
            likes: true
          },
          quietHours: {
            start: '22:00',
            end: '08:00'
          }
        }
      }

      const userB: User = {
        ...userA,
        id: 'user-2',
        email: 'user2@example.com',
        displayName: 'User B'
      }

      vi.mocked(window.spark.kv.get).mockResolvedValue([])
      vi.mocked(window.spark.kv.set).mockResolvedValue(undefined)

      await service.notifyMatchCreated(match, userA, userB)

      expect(window.spark.kv.set).not.toHaveBeenCalled()
    })
  })

  describe('isDuplicate', () => {
    it('should detect duplicate notifications', () => {
      const notificationId = 'test-123'
      
      const first = (service as any).isDuplicate(notificationId)
      const second = (service as any).isDuplicate(notificationId)
      
      expect(first).toBe(false)
      expect(second).toBe(true)
    })
  })
})

