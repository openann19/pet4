/**
 * GDPR Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GDPRService, type UserDataExport, type DataDeletionResult } from '../gdpr-service';
import type { UserProfile, Session } from '../enhanced-auth';

const { mockDbFindById, mockDbFindMany, mockDbFindOne, mockDbDelete, mockApiGet, mockApiPost } = vi.hoisted(() => ({
  mockDbFindById: vi.fn(),
  mockDbFindMany: vi.fn(),
  mockDbFindOne: vi.fn(),
  mockDbDelete: vi.fn(),
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
}));

vi.mock('../database', () => ({
  db: {
    get findById() {
      return mockDbFindById;
    },
    get findMany() {
      return mockDbFindMany;
    },
    get findOne() {
      return mockDbFindOne;
    },
    get delete() {
      return mockDbDelete;
    },
  },
}));

vi.mock('../api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
  },
}));

describe('GDPRService', () => {
  let service: GDPRService;

  const mockUserId = 'user-123';
  const DATE_STRING = '2024-01-01T00:00:00Z';
  const mockUser: UserProfile = {
    id: mockUserId,
    createdAt: DATE_STRING,
    updatedAt: DATE_STRING,
    displayName: 'Test User',
    email: 'test@example.com',
    roles: ['user'],
    status: 'active',
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
    lastSeenAt: DATE_STRING,
  };

  const mockSession: Session = {
    id: 'session-123',
    createdAt: DATE_STRING,
    updatedAt: DATE_STRING,
    userId: mockUserId,
    expiresAt: '2024-12-31T23:59:59Z',
    lastActivityAt: DATE_STRING,
  };

  beforeEach(() => {
    service = new GDPRService();
    vi.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should export all user data successfully', async () => {
      mockDbFindById.mockResolvedValue(mockUser);
      mockDbFindMany.mockResolvedValue({
        data: [],
        total: 0,
        hasMore: false,
      });
      mockDbFindOne.mockResolvedValue(null);

      const result = await service.exportUserData(mockUserId);

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.sessions).toEqual([]);
      expect(result.pets).toEqual([]);
      expect(result.matches).toEqual([]);
      expect(result.chats).toEqual([]);
      expect(result.posts).toEqual([]);
      expect(result.payments).toEqual([]);
      expect(result.metadata.userId).toBe(mockUserId);
      expect(result.metadata.exportDate).toBeDefined();
      expect(result.metadata.exportVersion).toBe('1.0');
    });

    it('should throw error when user not found', async () => {
      mockDbFindById.mockResolvedValue(null);

      await expect(service.exportUserData(mockUserId)).rejects.toThrow('User not found');
    });

    it('should fetch all related data collections', async () => {
      const mockPet = {
        id: 'pet-123',
        createdAt: DATE_STRING,
        updatedAt: DATE_STRING,
        ownerId: mockUserId,
        name: 'Fluffy',
        species: 'cat',
        photos: [],
      };

      const mockMatch = {
        id: 'match-123',
        createdAt: DATE_STRING,
        updatedAt: DATE_STRING,
        ownerId: mockUserId,
        petId: 'pet-123',
        matchedPetId: 'pet-456',
        status: 'matched' as const,
      };

      mockDbFindById.mockResolvedValue(mockUser);
      mockDbFindMany
        .mockResolvedValueOnce({ data: [mockSession], total: 1, hasMore: false })
        .mockResolvedValueOnce({ data: [mockPet], total: 1, hasMore: false })
        .mockResolvedValueOnce({ data: [mockMatch], total: 1, hasMore: false })
        .mockResolvedValue({ data: [], total: 0, hasMore: false });
      mockDbFindOne.mockResolvedValue(null);

      const result = await service.exportUserData(mockUserId);

      expect(result.sessions).toHaveLength(1);
      expect(result.pets).toHaveLength(1);
      expect(result.matches).toHaveLength(1);
      const pet = result.pets[0];
      const match = result.matches[0];
      expect(pet).toBeDefined();
      expect(pet).toEqual(mockPet);
      expect(match).toBeDefined();
      expect(match).toEqual(mockMatch);
    });

    it('should handle errors during data fetch', async () => {
      mockDbFindById.mockRejectedValue(new Error('Database error'));

      await expect(service.exportUserData(mockUserId)).rejects.toThrow(
        'Failed to export user data'
      );
    });
  });

  describe('deleteUserData', () => {
    it('should delete all user data successfully', async () => {
      mockDbFindMany.mockResolvedValue({
        data: [],
        total: 0,
        hasMore: false,
      });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockResolvedValue(true);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(true);
      expect(result.deletedCollections).toContain('users');
      expect(result.deletedRecords).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should delete all related collections', async () => {
      const mockPet = {
        id: 'pet-123',
        createdAt: DATE_STRING,
        updatedAt: DATE_STRING,
        ownerId: mockUserId,
        name: 'Fluffy',
        species: 'cat',
        photos: [],
      };

      const mockMatch = {
        id: 'match-123',
        createdAt: DATE_STRING,
        updatedAt: DATE_STRING,
        ownerId: mockUserId,
        petId: 'pet-123',
        matchedPetId: 'pet-456',
        status: 'matched' as const,
      };

      mockDbFindMany
        .mockResolvedValueOnce({ data: [mockSession], total: 1, hasMore: false })
        .mockResolvedValueOnce({ data: [mockPet], total: 1, hasMore: false })
        .mockResolvedValueOnce({ data: [mockMatch], total: 1, hasMore: false })
        .mockResolvedValue({ data: [], total: 0, hasMore: false });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockResolvedValue(true);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(true);
      expect(result.deletedCollections).toContain('sessions');
      expect(result.deletedCollections).toContain('pets');
      expect(result.deletedCollections).toContain('matches');
      expect(result.deletedCollections).toContain('users');
      expect(result.deletedRecords).toBe(4);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle deletion errors gracefully', async () => {
      const mockPet = {
        id: 'pet-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        ownerId: mockUserId,
        name: 'Fluffy',
        species: 'cat',
        photos: [],
      };

      mockDbFindMany
        .mockResolvedValueOnce({ data: [], total: 0, hasMore: false })
        .mockResolvedValueOnce({ data: [mockPet], total: 1, hasMore: false })
        .mockResolvedValue({ data: [], total: 0, hasMore: false });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockRejectedValueOnce(new Error('Deletion failed')).mockResolvedValueOnce(true);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      const error = result.errors[0];
      if (error) {
        expect(error.collection).toBe('pets');
        expect(error.recordId).toBe('pet-123');
      }
      expect(result.deletedRecords).toBeGreaterThan(0);
    });

    it('should handle collection fetch errors', async () => {
      mockDbFindMany.mockRejectedValue(new Error('Database error'));
      mockDbFindOne.mockResolvedValue(null);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should always attempt to delete user record', async () => {
      mockDbFindMany.mockResolvedValue({
        data: [],
        total: 0,
        hasMore: false,
      });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockResolvedValue(true);

      await service.deleteUserData(mockUserId);

      expect(mockDbDelete).toHaveBeenCalledWith('users', mockUserId);
    });
  });

  describe('requestDataExport', () => {
    it('should request data export via API', async () => {
      const mockExport: UserDataExport = {
        user: mockUser,
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
        },
        payments: [],
        verification: [],
        metadata: {
          exportDate: DATE_STRING,
          exportVersion: '1.0',
          userId: mockUserId,
        },
      };

      mockApiGet.mockResolvedValue(mockExport);

      const result = await service.requestDataExport(mockUserId);

      expect(result).toEqual(mockExport);
      expect(mockApiGet).toHaveBeenCalledWith(`/api/gdpr/export/${mockUserId}`);
    });

    it('should handle API errors', async () => {
      const apiError = {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      };

      mockApiGet.mockRejectedValue(apiError);

      try {
        await service.requestDataExport(mockUserId);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toEqual(apiError);
      }
    });
  });

  describe('requestDataDeletion', () => {
    it('should request data deletion via API', async () => {
      const mockResult: DataDeletionResult = {
        success: true,
        deletedCollections: ['users', 'sessions'],
        deletedRecords: 2,
        errors: [],
      };

      mockApiPost.mockResolvedValue(mockResult);

      const result = await service.requestDataDeletion(mockUserId);

      expect(result).toEqual(mockResult);
      expect(mockApiPost).toHaveBeenCalledWith(`/api/gdpr/delete/${mockUserId}`, {});
    });

    it('should handle API errors', async () => {
      const apiError = {
        code: 'FORBIDDEN',
        message: 'Forbidden',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      };

      mockApiPost.mockRejectedValue(apiError);

      try {
        await service.requestDataDeletion(mockUserId);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toEqual(apiError);
      }
    });
  });

  describe('deleteUserData edge cases', () => {
    it('should handle non-array records gracefully', async () => {
      mockDbFindMany.mockResolvedValue({
        data: [],
        total: 0,
        hasMore: false,
      });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockResolvedValue(true);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(true);
      expect(result.deletedCollections).toContain('users');
    });

    it('should handle collection fetch errors', async () => {
      mockDbFindMany.mockRejectedValue(new Error('Database error'));
      mockDbFindOne.mockResolvedValue(null);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle non-Error types in deletion', async () => {
      mockDbFindMany.mockResolvedValue({
        data: [],
        total: 0,
        hasMore: false,
      });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockRejectedValue('String error');

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle deletion success path with logger.debug', async () => {
      mockDbFindMany.mockResolvedValue({
        data: [],
        total: 0,
        hasMore: false,
      });
      mockDbFindOne.mockResolvedValue(null);
      mockDbDelete.mockResolvedValue(true);

      const result = await service.deleteUserData(mockUserId);

      expect(result.success).toBe(true);
      expect(result.deletedCollections).toContain('users');
    });
  });
});
