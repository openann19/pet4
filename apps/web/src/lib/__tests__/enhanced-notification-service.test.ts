/**
 * Enhanced Notification Service Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APIClient } from '../api-client';
import type { Match, User } from '../contracts';
import { EnhancedNotificationService } from '../enhanced-notification-service';
import { pushNotifications } from '../push-notifications';

vi.mock('../push-notifications', () => ({
  pushNotifications: {
    showNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../api-client', () => ({
  APIClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('EnhancedNotificationService', () => {
  let service: EnhancedNotificationService;

  beforeEach(() => {
    service = new EnhancedNotificationService();
    vi.clearAllMocks();
    vi.mocked(APIClient.post).mockResolvedValue({ data: null } as Awaited<ReturnType<typeof APIClient.post>>);
    vi.mocked(APIClient.get).mockResolvedValue({ data: null } as Awaited<ReturnType<typeof APIClient.get>>);
  });

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
          overall: 85,
        },
        status: 'active',
        chatRoomId: 'room-123',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      };

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
            likes: true,
          },
          quietHours: null,
        },
      };

      const userB: User = {
        ...userA,
        id: 'user-2',
        email: 'user2@example.com',
        displayName: 'User B',
      };

      await service.notifyMatchCreated(match, userA, userB);
      expect(pushNotifications.showNotification).toHaveBeenCalledTimes(2);
      expect(APIClient.post).toHaveBeenCalledTimes(2);
    });

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
          overall: 85,
        },
        status: 'active',
        chatRoomId: 'room-123',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      };

      const now = new Date();
      now.setHours(22, 0, 0, 0);

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
            likes: true,
          },
          quietHours: {
            start: '22:00',
            end: '08:00',
          },
        },
      };

      const userB: User = {
        ...userA,
        id: 'user-2',
        email: 'user2@example.com',
        displayName: 'User B',
      };

      vi.useFakeTimers();
      try {
        const quietTime = new Date();
        quietTime.setHours(22, 30, 0, 0);
        vi.setSystemTime(quietTime);

        await service.notifyMatchCreated(match, userA, userB);
        expect(pushNotifications.showNotification).not.toHaveBeenCalled();
        expect(APIClient.post).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('isDuplicate', () => {
    it('should detect duplicate notifications', () => {
      const notificationId = 'test-123';

      const first = (service as unknown as { isDuplicate: (id: string) => boolean }).isDuplicate(notificationId);
      const second = (service as unknown as { isDuplicate: (id: string) => boolean }).isDuplicate(notificationId);

      expect(first).toBe(false);
      expect(second).toBe(true);
    });
  });
});
