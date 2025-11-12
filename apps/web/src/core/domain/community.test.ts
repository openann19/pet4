import { describe, it, expect } from 'vitest';
import {
  isValidPostStatusTransition,
  isValidCommentStatusTransition,
  canEditPost,
  canReceiveComments,
  canReceiveReactions,
  canEditComment,
  canCommentReceiveReactions,
  canViewPost,
} from './community';

describe('Community Domain', () => {
  describe('isValidPostStatusTransition', () => {
    it('should not allow transition to same status', () => {
      expect(isValidPostStatusTransition('active', 'active')).toBe(false);
      expect(isValidPostStatusTransition('pending_review', 'pending_review')).toBe(false);
    });

    it('should allow pending_review -> active', () => {
      expect(isValidPostStatusTransition('pending_review', 'active')).toBe(true);
    });

    it('should allow pending_review -> rejected', () => {
      expect(isValidPostStatusTransition('pending_review', 'rejected')).toBe(true);
    });

    it('should allow active -> archived', () => {
      expect(isValidPostStatusTransition('active', 'archived')).toBe(true);
    });

    it('should allow rejected -> archived', () => {
      expect(isValidPostStatusTransition('rejected', 'archived')).toBe(true);
    });

    it('should not allow archived -> any status', () => {
      expect(isValidPostStatusTransition('archived', 'active')).toBe(false);
      expect(isValidPostStatusTransition('archived', 'pending_review')).toBe(false);
    });

    it('should not allow invalid transitions', () => {
      expect(isValidPostStatusTransition('active', 'pending_review')).toBe(false);
      expect(isValidPostStatusTransition('rejected', 'active')).toBe(false);
    });
  });

  describe('isValidCommentStatusTransition', () => {
    it('should not allow transition to same status', () => {
      expect(isValidCommentStatusTransition('active', 'active')).toBe(false);
      expect(isValidCommentStatusTransition('deleted', 'deleted')).toBe(false);
    });

    it('should allow active -> deleted', () => {
      expect(isValidCommentStatusTransition('active', 'deleted')).toBe(true);
    });

    it('should allow active -> hidden', () => {
      expect(isValidCommentStatusTransition('active', 'hidden')).toBe(true);
    });

    it('should allow deleted -> active', () => {
      expect(isValidCommentStatusTransition('deleted', 'active')).toBe(true);
    });

    it('should allow hidden -> active', () => {
      expect(isValidCommentStatusTransition('hidden', 'active')).toBe(true);
    });

    it('should not allow deleted -> hidden', () => {
      expect(isValidCommentStatusTransition('deleted', 'hidden')).toBe(false);
    });
  });

  describe('canEditPost', () => {
    it('should allow editing for pending_review', () => {
      expect(canEditPost('pending_review')).toBe(true);
    });

    it('should allow editing for active', () => {
      expect(canEditPost('active')).toBe(true);
    });

    it('should not allow editing for rejected', () => {
      expect(canEditPost('rejected')).toBe(false);
    });

    it('should not allow editing for archived', () => {
      expect(canEditPost('archived')).toBe(false);
    });
  });

  describe('canReceiveComments', () => {
    it('should allow comments for active', () => {
      expect(canReceiveComments('active')).toBe(true);
    });

    it('should not allow comments for pending_review', () => {
      expect(canReceiveComments('pending_review')).toBe(false);
    });

    it('should not allow comments for rejected', () => {
      expect(canReceiveComments('rejected')).toBe(false);
    });

    it('should not allow comments for archived', () => {
      expect(canReceiveComments('archived')).toBe(false);
    });
  });

  describe('canReceiveReactions', () => {
    it('should allow reactions for active', () => {
      expect(canReceiveReactions('active')).toBe(true);
    });

    it('should not allow reactions for other statuses', () => {
      expect(canReceiveReactions('pending_review')).toBe(false);
      expect(canReceiveReactions('rejected')).toBe(false);
      expect(canReceiveReactions('archived')).toBe(false);
    });
  });

  describe('canEditComment', () => {
    it('should allow editing for active', () => {
      expect(canEditComment('active')).toBe(true);
    });

    it('should not allow editing for deleted', () => {
      expect(canEditComment('deleted')).toBe(false);
    });

    it('should not allow editing for hidden', () => {
      expect(canEditComment('hidden')).toBe(false);
    });
  });

  describe('canCommentReceiveReactions', () => {
    it('should allow reactions for active', () => {
      expect(canCommentReceiveReactions('active')).toBe(true);
    });

    it('should not allow reactions for deleted', () => {
      expect(canCommentReceiveReactions('deleted')).toBe(false);
    });

    it('should not allow reactions for hidden', () => {
      expect(canCommentReceiveReactions('hidden')).toBe(false);
    });
  });

  describe('canViewPost', () => {
    it('should allow viewing public posts for anyone', () => {
      expect(canViewPost('public', 'owner')).toBe(true);
      expect(canViewPost('public', 'match')).toBe(true);
      expect(canViewPost('public', 'follower')).toBe(true);
      expect(canViewPost('public', 'none')).toBe(true);
    });

    it('should allow viewing matches posts for owner and matches', () => {
      expect(canViewPost('matches', 'owner')).toBe(true);
      expect(canViewPost('matches', 'match')).toBe(true);
      expect(canViewPost('matches', 'follower')).toBe(false);
      expect(canViewPost('matches', 'none')).toBe(false);
    });

    it('should allow viewing followers posts for owner and followers', () => {
      expect(canViewPost('followers', 'owner')).toBe(true);
      expect(canViewPost('followers', 'follower')).toBe(true);
      expect(canViewPost('followers', 'match')).toBe(false);
      expect(canViewPost('followers', 'none')).toBe(false);
    });

    it('should only allow viewing private posts for owner', () => {
      expect(canViewPost('private', 'owner')).toBe(true);
      expect(canViewPost('private', 'match')).toBe(false);
      expect(canViewPost('private', 'follower')).toBe(false);
      expect(canViewPost('private', 'none')).toBe(false);
    });
  });
});
