/**
 * Business Domain - Plans and Entitlements
 *
 * Core business logic for plans, entitlements, and usage limits.
 * This is pure domain logic with no infrastructure dependencies.
 */

export type Plan = 'free' | 'premium' | 'elite';

/**
 * Entitlements define what a user can do based on their plan
 */
export interface Entitlements {
  swipeDailyCap: number | 'unlimited';
  superLikesPerDay: number;
  boostsPerWeek: number;
  canSeeWhoLikedYou: boolean;
  videoCalls: boolean;
  advancedFilters: boolean;
  readReceipts: boolean;
  priorityRanking: boolean;
  profileReviewFastLane: boolean;
  adoptionListingLimit: number;
}

/**
 * Get entitlements for a plan tier
 *
 * This is pure domain logic - no infrastructure dependencies.
 * Single source of truth for entitlement definitions.
 */
export function getEntitlementsForPlan(plan: Plan): Entitlements {
  switch (plan) {
    case 'free':
      return {
        swipeDailyCap: 5,
        superLikesPerDay: 0,
        boostsPerWeek: 0,
        canSeeWhoLikedYou: false,
        videoCalls: false,
        advancedFilters: false,
        readReceipts: false,
        priorityRanking: false,
        profileReviewFastLane: false,
        adoptionListingLimit: 1,
      };
    case 'premium':
      return {
        swipeDailyCap: 'unlimited',
        superLikesPerDay: 0,
        boostsPerWeek: 1,
        canSeeWhoLikedYou: true,
        videoCalls: true,
        advancedFilters: true,
        readReceipts: true,
        priorityRanking: false,
        profileReviewFastLane: false,
        adoptionListingLimit: 1,
      };
    case 'elite':
      return {
        swipeDailyCap: 'unlimited',
        superLikesPerDay: 10,
        boostsPerWeek: 2,
        canSeeWhoLikedYou: true,
        videoCalls: true,
        advancedFilters: true,
        readReceipts: true,
        priorityRanking: true,
        profileReviewFastLane: true,
        adoptionListingLimit: 1,
      };
    default:
      return getEntitlementsForPlan('free');
  }
}

/**
 * Usage tracking for daily/weekly limits
 */
export interface UsageCounter {
  userId: string;
  day: string; // YYYY-MM-DD format
  swipes: number;
  superLikes: number;
  boostsThisWeek: number;
  week: string; // YYYY-WW format
  updatedAt: string;
}

/**
 * Check if usage is within entitlement limits
 *
 * Pure domain logic for checking if an action is allowed.
 */
export function checkUsageWithinLimits(
  entitlements: Entitlements,
  usage: UsageCounter,
  action: 'swipe' | 'super_like' | 'boost'
): { allowed: boolean; reason?: string; limit?: number; remaining?: number } {
  switch (action) {
    case 'swipe': {
      if (entitlements.swipeDailyCap === 'unlimited') {
        return { allowed: true };
      }
      const swipesRemaining = entitlements.swipeDailyCap - usage.swipes;
      if (swipesRemaining <= 0) {
        return {
          allowed: false,
          reason: 'Daily swipe limit reached',
          limit: entitlements.swipeDailyCap,
          remaining: 0,
        };
      }
      return {
        allowed: true,
        limit: entitlements.swipeDailyCap,
        remaining: swipesRemaining,
      };
    }

    case 'super_like': {
      const superLikesRemaining = entitlements.superLikesPerDay - usage.superLikes;
      if (superLikesRemaining <= 0) {
        return {
          allowed: false,
          reason: 'Daily super like limit reached',
          limit: entitlements.superLikesPerDay,
          remaining: 0,
        };
      }
      return {
        allowed: true,
        limit: entitlements.superLikesPerDay,
        remaining: superLikesRemaining,
      };
    }

    case 'boost': {
      const boostsRemaining = entitlements.boostsPerWeek - usage.boostsThisWeek;
      if (boostsRemaining <= 0) {
        return {
          allowed: false,
          reason: 'Weekly boost limit reached',
          limit: entitlements.boostsPerWeek,
          remaining: 0,
        };
      }
      return {
        allowed: true,
        limit: entitlements.boostsPerWeek,
        remaining: boostsRemaining,
      };
    }

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

/**
 * Check if a feature is enabled for the user's plan
 */
export function isFeatureEnabled(
  entitlements: Entitlements,
  feature:
    | 'see_who_liked_you'
    | 'video_call'
    | 'advanced_filter'
    | 'read_receipt'
    | 'priority_ranking'
    | 'profile_review_fast_lane'
    | 'adoption_listing'
): boolean {
  switch (feature) {
    case 'see_who_liked_you':
      return entitlements.canSeeWhoLikedYou;
    case 'video_call':
      return entitlements.videoCalls;
    case 'advanced_filter':
      return entitlements.advancedFilters;
    case 'read_receipt':
      return entitlements.readReceipts;
    case 'priority_ranking':
      return entitlements.priorityRanking;
    case 'profile_review_fast_lane':
      return entitlements.profileReviewFastLane;
    case 'adoption_listing':
      return entitlements.adoptionListingLimit > 0;
    default:
      return false;
  }
}
