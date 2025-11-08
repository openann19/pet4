/**
 * Business Core Types
 *
 * Defines the domain model for plans, entitlements, purchases, and usage tracking.
 */

export type Plan = 'free' | 'premium' | 'elite';

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

export interface Purchase {
  id: string;
  userId: string;
  sku: string;
  type: 'subscription' | 'consumable';
  platform: 'ios' | 'android' | 'web';
  receipt: string;
  status: 'pending' | 'active' | 'expired' | 'refunded';
  startedAt: string;
  expiresAt?: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  verifiedAt?: string;
}

export interface UsageCounter {
  userId: string;
  day: string; // YYYY-MM-DD format
  swipes: number;
  superLikes: number;
  boostsThisWeek: number;
  week: string; // YYYY-WW format
  updatedAt: string;
}

export interface BusinessConfig {
  id: string;
  version: string;
  prices: {
    premium: {
      monthly: number;
      yearly: number;
      currency: string;
    };
    elite: {
      monthly: number;
      yearly: number;
      currency: string;
    };
    boost: {
      price: number;
      currency: string;
    };
    superLike: {
      price: number;
      currency: string;
    };
  };
  limits: {
    free: {
      swipeDailyCap: number;
      adoptionListingLimit: number;
    };
    premium: {
      boostsPerWeek: number;
      superLikesPerDay: number;
    };
    elite: {
      boostsPerWeek: number;
      superLikesPerDay: number;
    };
  };
  experiments: Record<
    string,
    {
      enabled: boolean;
      rollout: number; // 0-100 percentage
      params: Record<string, unknown>;
    }
  >;
  updatedAt: string;
  updatedBy: string;
}

export interface ReferralCredit {
  id: string;
  referrerId: string;
  referredId: string;
  credits: number;
  type: 'boost' | 'super_like' | 'premium_days';
  status: 'pending' | 'awarded' | 'used';
  createdAt: string;
  expiresAt?: string;
}
