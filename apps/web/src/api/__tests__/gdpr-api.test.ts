/**
 * GDPR API Tests
 *
 * Unit tests for GDPR API client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gdprApi } from '../gdpr-api';
import { APIClient } from '@/lib/api-client';
import type { UserDataExport, DataDeletionResult, ConsentRecord } from '@petspark/shared';

vi.mock('@/lib/api-client');
vi.mock('@/lib/logger');

describe('GDPR API', () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(APIClient.get).mockImplementation(mockGet);
    vi.mocked(APIClient.post).mockImplementation(mockPost);
  });

  describe('exportUserData', () => {
    it('should export user data successfully', async () => {
      const mockExport: UserDataExport = {
        user: {
          id: 'user1',
          email: 'test@example.com',
          displayName: 'Test User',
          ageVerified: true,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
        },
        sessions: [],
        pets: [],
        matches: [],
        chats: [],
        posts: [],
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
          privacy: {
            profileVisibility: 'public',
            locationSharing: 'approximate',
            onlineStatus: 'visible',
            readReceipts: true,
            activityStatus: true,
            allowStorySharing: true,
            allowAnalytics: false,
          },
        },
        payments: [],
        verification: [],
        consents: [],
        metadata: {
          exportDate: new Date().toISOString(),
          exportVersion: '1.0',
          userId: 'user1',
          format: 'json',
        },
      };

      mockPost.mockResolvedValue({ data: mockExport });

      const result = await gdprApi.exportUserData({ userId: 'user1', format: 'json' });

      expect(result).toEqual(mockExport);
      expect(mockPost).toHaveBeenCalledWith('/api/gdpr/export', { userId: 'user1', format: 'json' });
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockPost.mockRejectedValue(error);

      await expect(gdprApi.exportUserData({ userId: 'user1' })).rejects.toThrow('Export failed');
    });
  });

  describe('deleteUserData', () => {
    it('should delete user data successfully', async () => {
      const mockResult: DataDeletionResult = {
        success: true,
        deletedCollections: ['users', 'pets', 'matches'],
        deletedRecords: 10,
        errors: [],
      };

      mockPost.mockResolvedValue({ data: mockResult });

      const result = await gdprApi.deleteUserData({
        userId: 'user1',
        confirmDeletion: true,
      });

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith('/api/gdpr/delete', {
        userId: 'user1',
        confirmDeletion: true,
      });
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockPost.mockRejectedValue(error);

      await expect(
        gdprApi.deleteUserData({ userId: 'user1', confirmDeletion: true })
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('getConsentStatus', () => {
    it('should get consent status successfully', async () => {
      const mockConsents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
      ];

      mockGet.mockResolvedValue({ data: mockConsents });

      const result = await gdprApi.getConsentStatus('user1');

      expect(result).toEqual(mockConsents);
      expect(mockGet).toHaveBeenCalledWith('/api/gdpr/consent?userId=user1');
    });

    it('should return empty array on error', async () => {
      mockGet.mockRejectedValue(new Error('Failed'));

      const result = await gdprApi.getConsentStatus('user1');

      expect(result).toEqual([]);
    });
  });

  describe('updateConsent', () => {
    it('should update consent successfully', async () => {
      const mockConsent: ConsentRecord = {
        id: '1',
        userId: 'user1',
        category: 'analytics',
        status: 'accepted',
        version: '1.0.0',
        acceptedAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValue({ data: mockConsent });

      const result = await gdprApi.updateConsent({
        userId: 'user1',
        category: 'analytics',
        status: 'accepted',
        version: '1.0.0',
      });

      expect(result).toEqual(mockConsent);
      expect(mockPost).toHaveBeenCalledWith('/api/gdpr/consent', {
        userId: 'user1',
        category: 'analytics',
        status: 'accepted',
        version: '1.0.0',
      });
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockPost.mockRejectedValue(error);

      await expect(
        gdprApi.updateConsent({
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
        })
      ).rejects.toThrow('Update failed');
    });
  });
});
