/**
 * Photo Moderation Domain Tests
 *
 * Tests for photo moderation domain logic.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  isPhotoVisible,
  requiresKYC,
  shouldQuarantine,
  canAutoApprove,
  type PhotoScanResult,
} from '@/core/domain/photo-moderation';

describe('Photo Moderation Domain', () => {
  describe('isValidStatusTransition', () => {
    it('should allow transition from pending to scanning', () => {
      expect(isValidStatusTransition('pending', 'scanning')).toBe(true);
    });

    it('should allow transition from pending to approved', () => {
      expect(isValidStatusTransition('pending', 'approved')).toBe(true);
    });

    it('should allow transition from pending to rejected', () => {
      expect(isValidStatusTransition('pending', 'rejected')).toBe(true);
    });

    it('should allow transition from pending to held_for_kyc', () => {
      expect(isValidStatusTransition('pending', 'held_for_kyc')).toBe(true);
    });

    it('should allow transition from pending to quarantined', () => {
      expect(isValidStatusTransition('pending', 'quarantined')).toBe(true);
    });

    it('should allow transition from scanning to approved', () => {
      expect(isValidStatusTransition('scanning', 'approved')).toBe(true);
    });

    it('should allow transition from quarantined to approved', () => {
      expect(isValidStatusTransition('quarantined', 'approved')).toBe(true);
    });

    it('should allow transition from rejected to pending (resubmit)', () => {
      expect(isValidStatusTransition('rejected', 'pending')).toBe(true);
    });

    it('should not allow transition from approved to pending', () => {
      expect(isValidStatusTransition('approved', 'pending')).toBe(false);
    });

    it('should not allow transition from rejected to approved directly', () => {
      expect(isValidStatusTransition('rejected', 'approved')).toBe(false);
    });

    it('should not allow same status transition', () => {
      expect(isValidStatusTransition('pending', 'pending')).toBe(false);
    });
  });

  describe('isPhotoVisible', () => {
    it('should return true for approved photo without KYC requirement', () => {
      expect(isPhotoVisible('approved', false, false)).toBe(true);
    });

    it('should return true for approved photo with KYC requirement and verified', () => {
      expect(isPhotoVisible('approved', true, true)).toBe(true);
    });

    it('should return false for approved photo with KYC requirement but not verified', () => {
      expect(isPhotoVisible('approved', true, false)).toBe(false);
    });

    it('should return false for pending photo', () => {
      expect(isPhotoVisible('pending', false, false)).toBe(false);
    });

    it('should return false for rejected photo', () => {
      expect(isPhotoVisible('rejected', false, false)).toBe(false);
    });

    it('should return false for quarantined photo', () => {
      expect(isPhotoVisible('quarantined', false, false)).toBe(false);
    });

    it('should return false for held_for_kyc photo', () => {
      expect(isPhotoVisible('held_for_kyc', false, false)).toBe(false);
    });
  });

  describe('requiresKYC', () => {
    it('should return true for held_for_kyc status', () => {
      expect(requiresKYC('held_for_kyc', false)).toBe(true);
    });

    it('should return true for pending status when system requires KYC', () => {
      expect(requiresKYC('pending', true)).toBe(true);
    });

    it('should return false for pending status when system does not require KYC', () => {
      expect(requiresKYC('pending', false)).toBe(false);
    });

    it('should return false for approved status', () => {
      expect(requiresKYC('approved', true)).toBe(false);
    });
  });

  describe('shouldQuarantine', () => {
    it('should return true for high NSFW score', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.8,
        toxicityScore: 0,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(shouldQuarantine(scanResult)).toBe(true);
    });

    it('should return true for high toxicity score', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.5,
        toxicityScore: 0.9,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(shouldQuarantine(scanResult)).toBe(true);
    });

    it('should return true for many detected issues', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.5,
        toxicityScore: 0.5,
        contentFingerprint: 'test',
        detectedIssues: ['issue1', 'issue2', 'issue3', 'issue4'],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(shouldQuarantine(scanResult)).toBe(true);
    });

    it('should return false for clean photo', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.1,
        toxicityScore: 0.1,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(shouldQuarantine(scanResult)).toBe(false);
    });
  });

  describe('canAutoApprove', () => {
    it('should return true for clean photo', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.05,
        toxicityScore: 0.05,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(canAutoApprove(scanResult)).toBe(true);
    });

    it('should return false for high NSFW score', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.2,
        toxicityScore: 0.05,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(canAutoApprove(scanResult)).toBe(false);
    });

    it('should return false for high toxicity score', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.05,
        toxicityScore: 0.2,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(canAutoApprove(scanResult)).toBe(false);
    });

    it('should return false for detected issues', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.05,
        toxicityScore: 0.05,
        contentFingerprint: 'test',
        detectedIssues: ['issue1'],
        requiresManualReview: false,
        scannedAt: new Date().toISOString(),
      };
      expect(canAutoApprove(scanResult)).toBe(false);
    });

    it('should return false when manual review required', () => {
      const scanResult: PhotoScanResult = {
        nsfwScore: 0.05,
        toxicityScore: 0.05,
        contentFingerprint: 'test',
        detectedIssues: [],
        requiresManualReview: true,
        scannedAt: new Date().toISOString(),
      };
      expect(canAutoApprove(scanResult)).toBe(false);
    });
  });
});
