import { describe, it, expect } from 'vitest'
import {
  type UsageCounter,
  getEntitlementsForPlan,
  checkUsageWithinLimits,
  isFeatureEnabled,
} from './business'

describe('Business Domain', () => {
  describe('getEntitlementsForPlan', () => {
    it('should return correct entitlements for free plan', () => {
      const entitlements = getEntitlementsForPlan('free')
      
      expect(entitlements.swipeDailyCap).toBe(5)
      expect(entitlements.superLikesPerDay).toBe(0)
      expect(entitlements.boostsPerWeek).toBe(0)
      expect(entitlements.canSeeWhoLikedYou).toBe(false)
      expect(entitlements.videoCalls).toBe(false)
      expect(entitlements.advancedFilters).toBe(false)
      expect(entitlements.readReceipts).toBe(false)
      expect(entitlements.priorityRanking).toBe(false)
      expect(entitlements.profileReviewFastLane).toBe(false)
      expect(entitlements.adoptionListingLimit).toBe(1)
    })

    it('should return correct entitlements for premium plan', () => {
      const entitlements = getEntitlementsForPlan('premium')
      
      expect(entitlements.swipeDailyCap).toBe('unlimited')
      expect(entitlements.superLikesPerDay).toBe(0)
      expect(entitlements.boostsPerWeek).toBe(1)
      expect(entitlements.canSeeWhoLikedYou).toBe(true)
      expect(entitlements.videoCalls).toBe(true)
      expect(entitlements.advancedFilters).toBe(true)
      expect(entitlements.readReceipts).toBe(true)
      expect(entitlements.priorityRanking).toBe(false)
      expect(entitlements.profileReviewFastLane).toBe(false)
      expect(entitlements.adoptionListingLimit).toBe(1)
    })

    it('should return correct entitlements for elite plan', () => {
      const entitlements = getEntitlementsForPlan('elite')
      
      expect(entitlements.swipeDailyCap).toBe('unlimited')
      expect(entitlements.superLikesPerDay).toBe(10)
      expect(entitlements.boostsPerWeek).toBe(2)
      expect(entitlements.canSeeWhoLikedYou).toBe(true)
      expect(entitlements.videoCalls).toBe(true)
      expect(entitlements.advancedFilters).toBe(true)
      expect(entitlements.readReceipts).toBe(true)
      expect(entitlements.priorityRanking).toBe(true)
      expect(entitlements.profileReviewFastLane).toBe(true)
      expect(entitlements.adoptionListingLimit).toBe(1)
    })
  })

  describe('checkUsageWithinLimits', () => {
    const freeEntitlements = getEntitlementsForPlan('free')
    const premiumEntitlements = getEntitlementsForPlan('premium')
    
    const usage: UsageCounter = {
      userId: 'user123',
      day: '2024-01-01',
      swipes: 3,
      superLikes: 0,
      boostsThisWeek: 0,
      week: '2024-W01',
      updatedAt: new Date().toISOString(),
    }

    it('should allow swipe when under limit', () => {
      const result = checkUsageWithinLimits(freeEntitlements, usage, 'swipe')
      
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(2)
    })

    it('should deny swipe when at limit', () => {
      const maxUsage: UsageCounter = {
        ...usage,
        swipes: 5,
      }
      
      const result = checkUsageWithinLimits(freeEntitlements, maxUsage, 'swipe')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Daily swipe limit reached')
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(0)
    })

    it('should allow unlimited swipes for premium', () => {
      const result = checkUsageWithinLimits(premiumEntitlements, usage, 'swipe')
      
      expect(result.allowed).toBe(true)
      expect(result.limit).toBeUndefined()
      expect(result.remaining).toBeUndefined()
    })

    it('should check super like limits', () => {
      const superLikeUsage: UsageCounter = {
        ...usage,
        superLikes: 5,
      }
      
      const result = checkUsageWithinLimits(freeEntitlements, superLikeUsage, 'super_like')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Daily super like limit reached')
      expect(result.limit).toBe(0)
      expect(result.remaining).toBe(0)
    })

    it('should check boost limits', () => {
      const boostUsage: UsageCounter = {
        ...usage,
        boostsThisWeek: 2,
      }
      
      const result = checkUsageWithinLimits(premiumEntitlements, boostUsage, 'boost')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Weekly boost limit reached')
      expect(result.limit).toBe(1)
      expect(result.remaining).toBe(0)
    })
  })

  describe('isFeatureEnabled', () => {
    const freeEntitlements = getEntitlementsForPlan('free')
    const premiumEntitlements = getEntitlementsForPlan('premium')
    const eliteEntitlements = getEntitlementsForPlan('elite')

    it('should check see_who_liked_you feature', () => {
      expect(isFeatureEnabled(freeEntitlements, 'see_who_liked_you')).toBe(false)
      expect(isFeatureEnabled(premiumEntitlements, 'see_who_liked_you')).toBe(true)
      expect(isFeatureEnabled(eliteEntitlements, 'see_who_liked_you')).toBe(true)
    })

    it('should check video_call feature', () => {
      expect(isFeatureEnabled(freeEntitlements, 'video_call')).toBe(false)
      expect(isFeatureEnabled(premiumEntitlements, 'video_call')).toBe(true)
      expect(isFeatureEnabled(eliteEntitlements, 'video_call')).toBe(true)
    })

    it('should check priority_ranking feature', () => {
      expect(isFeatureEnabled(freeEntitlements, 'priority_ranking')).toBe(false)
      expect(isFeatureEnabled(premiumEntitlements, 'priority_ranking')).toBe(false)
      expect(isFeatureEnabled(eliteEntitlements, 'priority_ranking')).toBe(true)
    })

    it('should check adoption_listing feature', () => {
      expect(isFeatureEnabled(freeEntitlements, 'adoption_listing')).toBe(true)
      expect(isFeatureEnabled(premiumEntitlements, 'adoption_listing')).toBe(true)
      expect(isFeatureEnabled(eliteEntitlements, 'adoption_listing')).toBe(true)
    })
  })
})

