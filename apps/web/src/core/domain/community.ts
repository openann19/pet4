/**
 * Community Domain - Post Workflows and Rules
 *
 * Core business logic for posts, comments, reactions, and visibility rules.
 * This is pure domain logic with no infrastructure dependencies.
 */

/**
 * Post status
 *
 * Valid state transitions:
 * - pending_review -> active (approved)
 * - pending_review -> rejected (moderation)
 * - active -> archived (user or system)
 * - rejected -> archived (final state)
 */
export type PostStatus = 'active' | 'pending_review' | 'rejected' | 'archived';

/**
 * Comment status
 *
 * Valid state transitions:
 * - active -> deleted (user deletion)
 * - active -> hidden (moderation)
 * - deleted -> active (restore, if allowed)
 * - hidden -> active (unhide, if allowed)
 */
export type CommentStatus = 'active' | 'deleted' | 'hidden';

/**
 * Post visibility
 */
export type PostVisibility = 'public' | 'matches' | 'followers' | 'private';

/**
 * Post kind
 */
export type PostKind = 'text' | 'photo' | 'video' | 'event';

/**
 * Check if a post status transition is valid
 */
export function isValidPostStatusTransition(current: PostStatus, next: PostStatus): boolean {
  // Can't transition to the same status
  if (current === next) {
    return false;
  }

  switch (current) {
    case 'pending_review':
      // Can go to active (approved) or rejected (moderation)
      return next === 'active' || next === 'rejected';

    case 'active':
      // Can go to archived (user or system action)
      return next === 'archived';

    case 'rejected':
      // Can go to archived (final state)
      return next === 'archived';

    case 'archived':
      // Final state - no transitions allowed
      return false;

    default:
      return false;
  }
}

/**
 * Check if a comment status transition is valid
 */
export function isValidCommentStatusTransition(
  current: CommentStatus,
  next: CommentStatus
): boolean {
  // Can't transition to the same status
  if (current === next) {
    return false;
  }

  switch (current) {
    case 'active':
      // Can go to deleted (user action) or hidden (moderation)
      return next === 'deleted' || next === 'hidden';

    case 'deleted':
      // Can potentially be restored (if policy allows)
      return next === 'active';

    case 'hidden':
      // Can potentially be unhidden (if policy allows)
      return next === 'active';

    default:
      return false;
  }
}

/**
 * Check if a post can be edited
 */
export function canEditPost(status: PostStatus): boolean {
  // Can only edit if pending review or active
  return status === 'pending_review' || status === 'active';
}

/**
 * Check if a post can receive comments
 */
export function canReceiveComments(status: PostStatus): boolean {
  // Can only receive comments if active
  return status === 'active';
}

/**
 * Check if a post can receive reactions
 */
export function canReceiveReactions(status: PostStatus): boolean {
  // Can only receive reactions if active
  return status === 'active';
}

/**
 * Check if a comment can be edited
 */
export function canEditComment(status: CommentStatus): boolean {
  // Can only edit if active
  return status === 'active';
}

/**
 * Check if a comment can receive reactions
 */
export function canCommentReceiveReactions(status: CommentStatus): boolean {
  // Can only receive reactions if active
  return status === 'active';
}

/**
 * Check if a post can be viewed based on visibility
 */
export function canViewPost(
  visibility: PostVisibility,
  viewerRelationship: 'owner' | 'match' | 'follower' | 'none'
): boolean {
  switch (visibility) {
    case 'public':
      return true;

    case 'matches':
      return viewerRelationship === 'owner' || viewerRelationship === 'match';

    case 'followers':
      return viewerRelationship === 'owner' || viewerRelationship === 'follower';

    case 'private':
      return viewerRelationship === 'owner';

    default:
      return false;
  }
}
