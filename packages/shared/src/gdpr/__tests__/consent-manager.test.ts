/**
 * Consent Manager Tests
 *
 * Unit tests for consent management utilities.
 */

import { describe, it, expect } from 'vitest';
import { ConsentManager } from '../consent-manager';
import { DEFAULT_CONSENT_PREFERENCES } from '../consent-types';
import type { ConsentRecord, ConsentCategory } from '../consent-types';

describe('ConsentManager', () => {
  describe('isConsentRequired', () => {
    it('should return false for essential consent', () => {
      expect(ConsentManager.isConsentRequired('essential')).toBe(false);
    });

    it('should return true for non-essential consent categories', () => {
      expect(ConsentManager.isConsentRequired('analytics')).toBe(true);
      expect(ConsentManager.isConsentRequired('marketing')).toBe(true);
      expect(ConsentManager.isConsentRequired('third_party')).toBe(true);
    });
  });

  describe('hasConsent', () => {
    it('should always return true for essential consent', () => {
      const consents: ConsentRecord[] = [];
      expect(ConsentManager.hasConsent(consents, 'essential')).toBe(true);
    });

    it('should return true if consent is accepted', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
      ];
      expect(ConsentManager.hasConsent(consents, 'analytics')).toBe(true);
    });

    it('should return false if consent is rejected', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'rejected',
          version: '1.0.0',
          rejectedAt: new Date().toISOString(),
        },
      ];
      expect(ConsentManager.hasConsent(consents, 'analytics')).toBe(false);
    });

    it('should return false if consent is not found', () => {
      const consents: ConsentRecord[] = [];
      expect(ConsentManager.hasConsent(consents, 'analytics')).toBe(false);
    });
  });

  describe('getConsentPreferences', () => {
    it('should return default preferences when no consents', () => {
      const consents: ConsentRecord[] = [];
      const preferences = ConsentManager.getConsentPreferences(consents);
      expect(preferences).toEqual(DEFAULT_CONSENT_PREFERENCES);
    });

    it('should return preferences based on consent records', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          category: 'marketing',
          status: 'rejected',
          version: '1.0.0',
          rejectedAt: new Date().toISOString(),
        },
      ];
      const preferences = ConsentManager.getConsentPreferences(consents);
      expect(preferences.essential).toBe(true);
      expect(preferences.analytics).toBe(true);
      expect(preferences.marketing).toBe(false);
      expect(preferences.thirdParty).toBe(false);
    });
  });

  describe('hasRequiredConsents', () => {
    it('should return true if all required consents are granted', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'essential',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
      ];
      expect(ConsentManager.hasRequiredConsents(consents)).toBe(true);
    });

    it('should return false if analytics consent is missing', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'essential',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
      ];
      expect(ConsentManager.hasRequiredConsents(consents)).toBe(false);
    });
  });

  describe('getConsentStatus', () => {
    it('should return accepted for essential consent', () => {
      const consents: ConsentRecord[] = [];
      expect(ConsentManager.getConsentStatus(consents, 'essential')).toBe('accepted');
    });

    it('should return status from consent record', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
      ];
      expect(ConsentManager.getConsentStatus(consents, 'analytics')).toBe('accepted');
    });

    it('should return pending if consent is not found', () => {
      const consents: ConsentRecord[] = [];
      expect(ConsentManager.getConsentStatus(consents, 'analytics')).toBe('pending');
    });
  });

  describe('canWithdrawConsent', () => {
    it('should return false for essential consent', () => {
      expect(ConsentManager.canWithdrawConsent('essential')).toBe(false);
    });

    it('should return true for non-essential consent categories', () => {
      expect(ConsentManager.canWithdrawConsent('analytics')).toBe(true);
      expect(ConsentManager.canWithdrawConsent('marketing')).toBe(true);
      expect(ConsentManager.canWithdrawConsent('third_party')).toBe(true);
    });
  });

  describe('validateConsentUpdate', () => {
    it('should return false if trying to reject essential consent', () => {
      expect(ConsentManager.validateConsentUpdate('essential', 'rejected')).toBe(false);
    });

    it('should return true for valid consent updates', () => {
      expect(ConsentManager.validateConsentUpdate('analytics', 'accepted')).toBe(true);
      expect(ConsentManager.validateConsentUpdate('analytics', 'rejected')).toBe(true);
      expect(ConsentManager.validateConsentUpdate('marketing', 'accepted')).toBe(true);
    });
  });

  describe('getConsentRecord', () => {
    it('should return consent record for category', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
      ];
      const record = ConsentManager.getConsentRecord(consents, 'analytics');
      expect(record).toBeDefined();
      expect(record?.category).toBe('analytics');
    });

    it('should return undefined if consent not found', () => {
      const consents: ConsentRecord[] = [];
      const record = ConsentManager.getConsentRecord(consents, 'analytics');
      expect(record).toBeUndefined();
    });
  });

  describe('filterByStatus', () => {
    it('should filter consents by status', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          category: 'marketing',
          status: 'rejected',
          version: '1.0.0',
          rejectedAt: new Date().toISOString(),
        },
      ];
      const accepted = ConsentManager.filterByStatus(consents, 'accepted');
      expect(accepted).toHaveLength(1);
      expect(accepted[0]?.category).toBe('analytics');
    });
  });

  describe('getLatestConsentVersion', () => {
    it('should return default version when no consents', () => {
      const consents: ConsentRecord[] = [];
      expect(ConsentManager.getLatestConsentVersion(consents)).toBe('1.0.0');
    });

    it('should return latest version from consents', () => {
      const consents: ConsentRecord[] = [
        {
          id: '1',
          userId: 'user1',
          category: 'analytics',
          status: 'accepted',
          version: '1.0.0',
          acceptedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          category: 'marketing',
          status: 'accepted',
          version: '1.1.0',
          acceptedAt: new Date().toISOString(),
        },
      ];
      expect(ConsentManager.getLatestConsentVersion(consents)).toBe('1.1.0');
    });
  });
});
