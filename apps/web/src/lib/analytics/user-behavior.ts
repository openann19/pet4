/**
 * User Behavior Analytics (Web)
 *
 * Tracks user behavior, conversion funnels, cohorts, and user journeys.
 * Features:
 * - Screen view tracking with session management
 * - Conversion funnel analysis
 * - Cohort analysis
 * - User journey tracking
 * - Event tracking with properties
 * - User segmentation
 *
 * Location: apps/web/src/lib/analytics/user-behavior.ts
 */

import { createLogger } from '../logger'

const logger = createLogger('user-behavior-analytics')

/**
 * Screen view event
 */
export interface ScreenViewEvent {
  readonly screenName: string
  readonly screenClass?: string
  readonly properties?: Record<string, unknown>
  readonly timestamp: number
}

/**
 * Conversion funnel step
 */
export interface FunnelStep {
  readonly name: string
  readonly order: number
  readonly eventName: string
  readonly properties?: Record<string, unknown>
}

/**
 * Funnel result
 */
export interface FunnelResult {
  readonly funnelName: string
  readonly steps: Array<{
    readonly step: FunnelStep
    readonly count: number
    readonly dropoffRate: number
    readonly conversionRate: number
  }>
  readonly totalConversions: number
  readonly overallConversionRate: number
}

/**
 * Cohort definition
 */
export interface CohortDefinition {
  readonly id: string
  readonly name: string
  readonly criteria: Record<string, unknown>
  readonly startDate: number
  readonly endDate?: number
}

/**
 * Cohort result
 */
export interface CohortResult {
  readonly cohort: CohortDefinition
  readonly userCount: number
  readonly retentionRate: number
  readonly metrics: Record<string, number>
}

/**
 * User journey event
 */
export interface UserJourneyEvent {
  readonly userId: string
  readonly eventName: string
  readonly properties?: Record<string, unknown>
  readonly timestamp: number
  readonly sessionId: string
}

/**
 * User journey
 */
export interface UserJourney {
  readonly userId: string
  readonly sessionId: string
  readonly events: readonly UserJourneyEvent[]
  readonly startTime: number
  readonly endTime?: number
  readonly duration?: number
}

/**
 * User behavior analytics
 */
export class UserBehaviorAnalytics {
  private readonly screenViews: ScreenViewEvent[] = []
  private readonly userJourneys = new Map<string, UserJourney>()
  private readonly funnels = new Map<string, FunnelStep[]>()
  private readonly cohorts = new Map<string, CohortDefinition>()

  /**
   * Track screen view
   */
  trackScreenView(event: Omit<ScreenViewEvent, 'timestamp'>): void {
    const screenView: ScreenViewEvent = {
      ...event,
      timestamp: Date.now(),
    }

    this.screenViews.push(screenView)

    logger.debug('Screen view tracked', {
      screenName: screenView.screenName,
      properties: screenView.properties,
    })
  }

  /**
   * Track user journey event
   */
  trackJourneyEvent(event: Omit<UserJourneyEvent, 'timestamp'>): void {
    const journeyEvent: UserJourneyEvent = {
      ...event,
      timestamp: Date.now(),
    }

    const journeyKey = `${event.userId}:${event.sessionId}`
    let journey = this.userJourneys.get(journeyKey)

    if (!journey) {
      journey = {
        userId: event.userId,
        sessionId: event.sessionId,
        events: [],
        startTime: Date.now(),
      }
    }

    journey = {
      ...journey,
      events: [...journey.events, journeyEvent],
      endTime: Date.now(),
      duration: Date.now() - journey.startTime,
    }

    this.userJourneys.set(journeyKey, journey)

    logger.debug('Journey event tracked', {
      userId: event.userId,
      sessionId: event.sessionId,
      eventName: event.eventName,
    })
  }

  /**
   * Define conversion funnel
   */
  defineFunnel(funnelName: string, steps: FunnelStep[]): void {
    this.funnels.set(funnelName, steps)
    logger.debug('Funnel defined', { funnelName, stepCount: steps.length })
  }

  /**
   * Analyze conversion funnel
   */
  analyzeFunnel(funnelName: string, events: UserJourneyEvent[]): FunnelResult | null {
    const steps = this.funnels.get(funnelName)
    if (!steps) {
      logger.warn('Funnel not found', { funnelName })
      return null
    }

    const stepCounts = steps.map((step) => {
      const matchingEvents = events.filter((e) => e.eventName === step.eventName)
      return {
        step,
        count: matchingEvents.length,
      }
    })

    const totalConversions = stepCounts[stepCounts.length - 1]?.count ?? 0
    const firstStepCount = stepCounts[0]?.count ?? 0
    const overallConversionRate =
      firstStepCount > 0 ? (totalConversions / firstStepCount) * 100 : 0

    const funnelSteps = stepCounts.map((stepCount, index) => {
      const previousCount = index > 0 ? stepCounts[index - 1]?.count ?? 0 : firstStepCount
      const dropoffRate =
        previousCount > 0 ? ((previousCount - stepCount.count) / previousCount) * 100 : 0
      const conversionRate =
        firstStepCount > 0 ? (stepCount.count / firstStepCount) * 100 : 0

      return {
        step: stepCount.step,
        count: stepCount.count,
        dropoffRate,
        conversionRate,
      }
    })

    return {
      funnelName,
      steps: funnelSteps,
      totalConversions,
      overallConversionRate,
    }
  }

  /**
   * Define cohort
   */
  defineCohort(cohort: CohortDefinition): void {
    this.cohorts.set(cohort.id, cohort)
    logger.debug('Cohort defined', { cohortId: cohort.id, cohortName: cohort.name })
  }

  /**
   * Analyze cohort
   */
  analyzeCohort(cohortId: string, events: UserJourneyEvent[]): CohortResult | null {
    const cohort = this.cohorts.get(cohortId)
    if (!cohort) {
      logger.warn('Cohort not found', { cohortId })
      return null
    }

    // Filter events by cohort criteria
    const cohortEvents = events.filter((e) => {
      if (e.timestamp < cohort.startDate) {
        return false
      }
      if (cohort.endDate && e.timestamp > cohort.endDate) {
        return false
      }
      return true
    })

    const userIds = new Set(cohortEvents.map((e) => e.userId))
    const userCount = userIds.size

    // Calculate retention rate (simplified)
    const retentionRate = userCount > 0 ? (cohortEvents.length / userCount) * 100 : 0

    // Calculate metrics
    const metrics: Record<string, number> = {
      totalEvents: cohortEvents.length,
      uniqueUsers: userCount,
      averageEventsPerUser: userCount > 0 ? cohortEvents.length / userCount : 0,
    }

    return {
      cohort,
      userCount,
      retentionRate,
      metrics,
    }
  }

  /**
   * Get user journey
   */
  getUserJourney(userId: string, sessionId: string): UserJourney | null {
    const journeyKey = `${userId}:${sessionId}`
    return this.userJourneys.get(journeyKey) ?? null
  }

  /**
   * Get screen views
   */
  getScreenViews(): readonly ScreenViewEvent[] {
    return [...this.screenViews]
  }

  /**
   * Clear analytics data
   */
  clear(): void {
    this.screenViews.length = 0
    this.userJourneys.clear()
    logger.debug('User behavior analytics data cleared')
  }
}

/**
 * Create user behavior analytics instance
 */
let analyticsInstance: UserBehaviorAnalytics | null = null

export function getUserBehaviorAnalytics(): UserBehaviorAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new UserBehaviorAnalytics()
  }
  return analyticsInstance
}
