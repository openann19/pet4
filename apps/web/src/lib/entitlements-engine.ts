/**
 * Entitlements Engine
 * 
 * Infrastructure layer for entitlement checks with storage access.
 * Uses domain logic from src/core/domain/business.ts for pure calculations.
 */

import type { Plan, Entitlements, UsageCounter } from '@/core/domain/business'
import { getEntitlementsForPlan, checkUsageWithinLimits, isFeatureEnabled } from '@/core/domain/business'
import { PaymentsService } from './payments-service'
import { paymentsApi } from '@/api/payments-api'
import { adoptionMarketplaceService } from './adoption-marketplace-service'
import { createLogger } from './logger'

const logger = createLogger('EntitlementsEngine')

/**
 * Get user's current plan from API
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const entitlements = await PaymentsService.getUserEntitlements(userId)
    // Map PlanTier to Plan (they have the same values)
    return entitlements.planTier as Plan
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get user plan', err, { userId })
    return 'free'
  }
}

/**
 * Get user's current entitlements
 */
export async function getUserEntitlements(userId: string): Promise<Entitlements> {
  const plan = await getUserPlan(userId)
  return getEntitlementsForPlan(plan)
}

/**
 * Check if user can perform an action
 * 
 * Uses domain logic from src/core/domain/business.ts for pure calculations.
 */
export async function canPerformAction(
  userId: string,
  action: 'swipe' | 'super_like' | 'boost' | 'see_who_liked' | 'video_call' | 'advanced_filter' | 'read_receipt' | 'adoption_listing'                           
): Promise<{ allowed: boolean; reason?: string; limit?: number; remaining?: number }> {                                                                         
  const entitlements = await getUserEntitlements(userId)
  const usage = await getUsageCounter(userId)

  // Use domain logic for usage-based actions
  switch (action) {
    case 'swipe':
    case 'super_like':
    case 'boost':
      return checkUsageWithinLimits(entitlements, usage, action)

    case 'see_who_liked':
      return { allowed: isFeatureEnabled(entitlements, 'see_who_liked_you') }

    case 'video_call':
      return { allowed: isFeatureEnabled(entitlements, 'video_call') }

    case 'advanced_filter':
      return { allowed: isFeatureEnabled(entitlements, 'advanced_filter') }

    case 'read_receipt':
      return { allowed: isFeatureEnabled(entitlements, 'read_receipt') }

    case 'adoption_listing':
      // Check active adoption listings count
      const activeListings = await getActiveAdoptionListingsCount(userId)
      if (activeListings >= entitlements.adoptionListingLimit) {
        return {
          allowed: false,
          reason: 'Adoption listing limit reached',
          limit: entitlements.adoptionListingLimit,
          remaining: 0,
        }
      }
      return { allowed: true, remaining: entitlements.adoptionListingLimit - activeListings }

    default:
      return { allowed: false, reason: 'Unknown action' }
  }
}

/**
 * Get usage counter for user (today)
 */
export async function getUsageCounter(userId: string): Promise<UsageCounter> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  if (!today) {
    throw new Error('Failed to get today date')
  }

  try {
    return await paymentsApi.getUsageCounter(userId, today)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get usage counter from API, returning zero usage', err, { userId, today })
    
    // Fallback to zero usage if API fails
    const weekStart = getWeekStart(today)
    return {
      userId,
      day: today,
      week: weekStart,
      swipes: 0,
      superLikes: 0,
      boostsThisWeek: 0,
      updatedAt: new Date().toISOString(),
    }
  }
}

/**
 * Increment usage counter atomically (idempotent with operationId)
 */
export async function incrementUsage(
  userId: string,
  type: 'swipe' | 'super_like' | 'boost',
  operationId?: string // For idempotency
): Promise<{ success: boolean; remaining?: number; limit?: number }> {
  const entitlements = await getUserEntitlements(userId)
  const usage = await getUsageCounter(userId)

  // Check limits using domain logic (client-side validation)
  const checkResult = checkUsageWithinLimits(entitlements, usage, type)
  if (!checkResult.allowed) {
    return {
      success: false,
      remaining: checkResult.remaining ?? 0,
      ...(checkResult.limit !== undefined ? { limit: checkResult.limit } : {}),
    }
  }

  // Persist usage increment via API
  try {
    return await paymentsApi.incrementUsage(userId, type, operationId)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to increment usage via API', err, { userId, type, operationId })
    
    // If API fails, return success but log warning (optimistic client-side check passed)
    return {
      success: true,
      ...(entitlements.swipeDailyCap !== 'unlimited' ? { remaining: entitlements.swipeDailyCap - (usage.swipes ?? 0) } : {}),
    }
  }
}

/**
 * Get week start (Monday) for a date
 */
function getWeekStart(date: string): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff))
  const year = monday.getFullYear()
  const week = Math.ceil((monday.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Get active adoption listings count for user
 */
async function getActiveAdoptionListingsCount(userId: string): Promise<number> {
  try {
    const listings = await adoptionMarketplaceService.getUserListings(userId)
    return listings.filter(l => l.status === 'active').length
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to get active adoption listings count', err, { userId })
    return 0
  }
}

