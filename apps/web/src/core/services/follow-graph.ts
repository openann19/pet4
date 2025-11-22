/**
 * Follow Graph Service
 *
 * Manages user follow relationships for community feed filtering and notifications.
 */

import { createLogger } from '@/lib/logger';
import { storage } from '@/lib/storage';

const logger = createLogger('FollowGraph');

export interface FollowRelationship {
  followerId: string;
  followingId: string;
  createdAt: string;
  status: 'active' | 'blocked';
}

const FOLLOW_STORAGE_KEY = 'follow-relationships';

/**
 * Get all follow relationships
 */
async function getFollowRelationships(): Promise<FollowRelationship[]> {
  return (await storage.get<FollowRelationship[]>(FOLLOW_STORAGE_KEY)) ?? [];
}

/**
 * Set follow relationships
 */
async function setFollowRelationships(relationships: FollowRelationship[]): Promise<void> {
  await storage.set(FOLLOW_STORAGE_KEY, relationships);
}

/**
 * Check if user A follows user B
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const relationships = await getFollowRelationships();
  return relationships.some(
    (r) => r.followerId === followerId && r.followingId === followingId && r.status === 'active'
  );
}

/**
 * Get all users that a user follows
 */
export async function getFollowing(userId: string): Promise<string[]> {
  const relationships = await getFollowRelationships();
  return relationships
    .filter((r) => r.followerId === userId && r.status === 'active')
    .map((r) => r.followingId);
}

/**
 * Get all followers of a user
 */
export async function getFollowers(userId: string): Promise<string[]> {
  const relationships = await getFollowRelationships();
  return relationships
    .filter((r) => r.followingId === userId && r.status === 'active')
    .map((r) => r.followerId);
}

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  const relationships = await getFollowRelationships();

  // Check if already following
  const existing = relationships.find(
    (r) => r.followerId === followerId && r.followingId === followingId
  );

  if (existing) {
    if (existing.status === 'active') {
      return; // Already following
    }
    // Re-activate blocked relationship
    existing.status = 'active';
    existing.createdAt = new Date().toISOString();
  } else {
    // Create new relationship
    relationships.push({
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
      status: 'active',
    });
  }

  await setFollowRelationships(relationships);
  logger.info('User followed', { followerId, followingId });
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const relationships = await getFollowRelationships();
  const index = relationships.findIndex(
    (r) => r.followerId === followerId && r.followingId === followingId
  );

  if (index >= 0) {
    relationships.splice(index, 1);
    await setFollowRelationships(relationships);
    logger.info('User unfollowed', { followerId, followingId });
  }
}

/**
 * Filter posts by follow relationships
 * Returns posts from users that the current user follows
 */
export async function filterPostsByFollows<T extends { authorId: string }>(
  posts: T[],
  userId: string
): Promise<T[]> {
  const following = await getFollowing(userId);
  const followingSet = new Set(following);

  return posts.filter((post) => followingSet.has(post.authorId));
}

/**
 * Check if user should receive notification for a post
 * Only notifies if user follows the post author
 */
export async function shouldNotifyForPost(postAuthorId: string, userId: string): Promise<boolean> {
  return await isFollowing(userId, postAuthorId);
}

/**
 * Check if user should receive notification for a live stream
 * Only notifies if user follows the stream host
 */
export async function shouldNotifyForStream(hostId: string, userId: string): Promise<boolean> {
  return await isFollowing(userId, hostId);
}
