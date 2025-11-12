/**
 * GDPR Routes Tests
 *
 * Unit tests for GDPR API routes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GDPRService } from '../../services/gdpr-service';
import { MockDatabase } from '../../services/mock-database';

describe('GDPR Routes', () => {
  let gdprService: GDPRService;

  beforeEach(() => {
    const db = new MockDatabase();
    gdprService = new GDPRService(db);
  });

  describe('POST /api/gdpr/export', () => {
    it('should export user data', async () => {
      const exportData = await gdprService.exportUserData({
        userId: 'user1',
        format: 'json',
      });

      expect(exportData).toHaveProperty('user');
      expect(exportData).toHaveProperty('sessions');
      expect(exportData).toHaveProperty('pets');
      expect(exportData.user.id).toBe('user1');
    });

    it('should throw error for invalid user', async () => {
      await expect(
        gdprService.exportUserData({
          userId: 'invalid-user',
          format: 'json',
        })
      ).rejects.toThrow();
    });
  });

  describe('POST /api/gdpr/delete', () => {
    it('should delete user data', async () => {
      const result = await gdprService.deleteUserData({
        userId: 'user1',
        confirmDeletion: true,
      });

      expect(result.success).toBe(true);
      expect(result.deletedCollections).toBeDefined();
      expect(result.deletedRecords).toBeGreaterThan(0);
    });

    it('should return error if deletion not confirmed', async () => {
      await expect(
        gdprService.deleteUserData({
          userId: 'user1',
          confirmDeletion: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/gdpr/consent', () => {
    it('should get consent status', async () => {
      const consents = await gdprService.getConsentStatus('user1');

      expect(Array.isArray(consents)).toBe(true);
      expect(consents.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/gdpr/consent', () => {
    it('should update consent', async () => {
      const consent = await gdprService.updateConsent({
        userId: 'user1',
        category: 'analytics',
        status: 'accepted',
        version: '1.0.0',
      });

      expect(consent.userId).toBe('user1');
      expect(consent.category).toBe('analytics');
      expect(consent.status).toBe('accepted');
    });
  });
});
