import { describe, it, expect } from 'vitest';
import {
  isValidListingStatusTransition,
  isValidApplicationStatusTransition,
  canEditListing,
  canReceiveApplications,
  canReviewApplication,
} from './adoption';

describe('Adoption Domain', () => {
  describe('isValidListingStatusTransition', () => {
    it('should not allow transition to same status', () => {
      expect(isValidListingStatusTransition('active', 'active')).toBe(false);
      expect(isValidListingStatusTransition('pending_review', 'pending_review')).toBe(false);
    });

    it('should allow pending_review -> active', () => {
      expect(isValidListingStatusTransition('pending_review', 'active')).toBe(true);
    });

    it('should allow pending_review -> withdrawn', () => {
      expect(isValidListingStatusTransition('pending_review', 'withdrawn')).toBe(true);
    });

    it('should allow active -> adopted', () => {
      expect(isValidListingStatusTransition('active', 'adopted')).toBe(true);
    });

    it('should allow active -> withdrawn', () => {
      expect(isValidListingStatusTransition('active', 'withdrawn')).toBe(true);
    });

    it('should not allow adopted -> any status', () => {
      expect(isValidListingStatusTransition('adopted', 'active')).toBe(false);
      expect(isValidListingStatusTransition('adopted', 'pending_review')).toBe(false);
      expect(isValidListingStatusTransition('adopted', 'withdrawn')).toBe(false);
    });

    it('should not allow withdrawn -> any status', () => {
      expect(isValidListingStatusTransition('withdrawn', 'active')).toBe(false);
      expect(isValidListingStatusTransition('withdrawn', 'pending_review')).toBe(false);
      expect(isValidListingStatusTransition('withdrawn', 'adopted')).toBe(false);
    });

    it('should not allow invalid transitions', () => {
      expect(isValidListingStatusTransition('active', 'pending_review')).toBe(false);
      expect(isValidListingStatusTransition('adopted', 'active')).toBe(false);
    });
  });

  describe('isValidApplicationStatusTransition', () => {
    it('should not allow transition to same status', () => {
      expect(isValidApplicationStatusTransition('submitted', 'submitted')).toBe(false);
      expect(isValidApplicationStatusTransition('under_review', 'under_review')).toBe(false);
    });

    it('should allow submitted -> under_review', () => {
      expect(isValidApplicationStatusTransition('submitted', 'under_review')).toBe(true);
    });

    it('should allow under_review -> accepted', () => {
      expect(isValidApplicationStatusTransition('under_review', 'accepted')).toBe(true);
    });

    it('should allow under_review -> rejected', () => {
      expect(isValidApplicationStatusTransition('under_review', 'rejected')).toBe(true);
    });

    it('should not allow accepted -> any status', () => {
      expect(isValidApplicationStatusTransition('accepted', 'rejected')).toBe(false);
      expect(isValidApplicationStatusTransition('accepted', 'under_review')).toBe(false);
    });

    it('should not allow rejected -> any status', () => {
      expect(isValidApplicationStatusTransition('rejected', 'accepted')).toBe(false);
      expect(isValidApplicationStatusTransition('rejected', 'under_review')).toBe(false);
    });

    it('should not allow invalid transitions', () => {
      expect(isValidApplicationStatusTransition('submitted', 'accepted')).toBe(false);
      expect(isValidApplicationStatusTransition('submitted', 'rejected')).toBe(false);
      expect(isValidApplicationStatusTransition('accepted', 'under_review')).toBe(false);
    });
  });

  describe('canEditListing', () => {
    it('should allow editing for pending_review', () => {
      expect(canEditListing('pending_review')).toBe(true);
    });

    it('should allow editing for active', () => {
      expect(canEditListing('active')).toBe(true);
    });

    it('should not allow editing for adopted', () => {
      expect(canEditListing('adopted')).toBe(false);
    });

    it('should not allow editing for withdrawn', () => {
      expect(canEditListing('withdrawn')).toBe(false);
    });
  });

  describe('canReceiveApplications', () => {
    it('should allow applications for active', () => {
      expect(canReceiveApplications('active')).toBe(true);
    });

    it('should not allow applications for pending_review', () => {
      expect(canReceiveApplications('pending_review')).toBe(false);
    });

    it('should not allow applications for adopted', () => {
      expect(canReceiveApplications('adopted')).toBe(false);
    });

    it('should not allow applications for withdrawn', () => {
      expect(canReceiveApplications('withdrawn')).toBe(false);
    });
  });

  describe('canReviewApplication', () => {
    it('should allow review for submitted', () => {
      expect(canReviewApplication('submitted')).toBe(true);
    });

    it('should allow review for under_review', () => {
      expect(canReviewApplication('under_review')).toBe(true);
    });

    it('should not allow review for accepted', () => {
      expect(canReviewApplication('accepted')).toBe(false);
    });

    it('should not allow review for rejected', () => {
      expect(canReviewApplication('rejected')).toBe(false);
    });
  });
});
