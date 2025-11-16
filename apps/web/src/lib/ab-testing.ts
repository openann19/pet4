/* eslint-disable max-lines -- A/B testing framework with comprehensive statistical analysis */
/**
 * A/B Testing Framework (Web)
 *
 * Provides A/B testing infrastructure with experiment configuration,
 * user segmentation, statistical significance testing, and results analysis.
 * Features:
 * - Experiment configuration
 * - User segmentation
 * - Statistical significance testing
 * - Results analysis and reporting
 *
 * Location: apps/web/src/lib/ab-testing.ts
 */

import { createLogger } from './logger'

const logger = createLogger('ab-testing')

/**
 * Experiment variant
 */
export interface ExperimentVariant {
  readonly id: string
  readonly name: string
  readonly weight: number // 0-100, percentage of users
  readonly config?: Record<string, unknown>
}

/**
 * Experiment status
 */
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'

/**
 * Experiment
 */
export interface Experiment {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly status: ExperimentStatus
  readonly variants: readonly ExperimentVariant[]
  readonly startDate: number
  readonly endDate?: number
  readonly targetAudience?: string[]
  readonly metrics: string[]
  readonly minSampleSize?: number
  readonly significanceLevel?: number
}

/**
 * Experiment result
 */
export interface ExperimentResult {
  readonly experimentId: string
  readonly variantResults: {
    readonly variant: ExperimentVariant
    readonly conversions: number
    readonly visitors: number
    readonly conversionRate: number
    readonly confidenceInterval: [number, number]
    readonly isSignificant: boolean
  }[]
  readonly overallResult: {
    readonly totalConversions: number
    readonly totalVisitors: number
    readonly winningVariant?: string
    readonly statisticalSignificance: number
  }
}

/**
 * User segment
 */
export interface UserSegment {
  readonly id: string
  readonly name: string
  readonly criteria: Record<string, unknown>
}

/**
 * A/B testing options
 */
export interface ABTestingOptions {
  readonly enableTracking?: boolean
  readonly enableSegmentation?: boolean
  readonly defaultSignificanceLevel?: number
}

/**
 * A/B tester
 */
export class ABTester {
  private readonly experiments = new Map<string, Experiment>()
  private readonly assignments = new Map<string, string>() // userId -> variantId
  private readonly conversions = new Map<string, Map<string, number>>() // experimentId -> variantId -> count
  private readonly visitors = new Map<string, Map<string, number>>() // experimentId -> variantId -> count
  private readonly enableTracking: boolean
  private readonly enableSegmentation: boolean
  private readonly defaultSignificanceLevel: number

  constructor(options: ABTestingOptions = {}) {
    this.enableTracking = options.enableTracking ?? true
    this.enableSegmentation = options.enableSegmentation ?? true
    this.defaultSignificanceLevel = options.defaultSignificanceLevel ?? 0.95
  }

  /**
   * Create experiment
   */
  createExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment)

    // Initialize tracking
    if (this.enableTracking) {
      this.conversions.set(experiment.id, new Map())
      this.visitors.set(experiment.id, new Map())

      experiment.variants.forEach((variant) => {
        this.conversions.get(experiment.id)?.set(variant.id, 0)
        this.visitors.get(experiment.id)?.set(variant.id, 0)
      })
    }

    logger.debug('Experiment created', {
      id: experiment.id,
      name: experiment.name,
      variantCount: experiment.variants.length,
    })
  }

  /**
   * Get experiment variant for user
   */
  getVariant(experimentId: string, userId: string): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId)

    if (!experiment) {
      logger.warn('Experiment not found', { experimentId })
      return null
    }

    if (experiment.status !== 'running') {
      logger.debug('Experiment not running', { experimentId, status: experiment.status })
      return null
    }

    // Check if user is already assigned
    const assignmentKey = `${experimentId}:${userId}`
    const existingAssignment = this.assignments.get(assignmentKey)

    if (existingAssignment) {
      const variant = experiment.variants.find((v) => v.id === existingAssignment)
      return variant ?? null
    }

    // Assign variant based on weight
    const variant = this.assignVariant(experiment, userId)

    if (variant) {
      this.assignments.set(assignmentKey, variant.id)

      // Track visitor
      if (this.enableTracking) {
        const visitors = this.visitors.get(experimentId)
        if (visitors) {
          const currentCount = visitors.get(variant.id) ?? 0
          visitors.set(variant.id, currentCount + 1)
        }
      }

      logger.debug('Variant assigned', {
        experimentId,
        userId,
        variantId: variant.id,
        variantName: variant.name,
      })
    }

    return variant
  }

  /**
   * Assign variant based on weight
   */
  private assignVariant(experiment: Experiment, userId: string): ExperimentVariant | null {
    // Use deterministic assignment based on userId
    const hash = this.hashString(userId + experiment.id)
    const random = hash % 100

    let cumulativeWeight = 0
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight
      if (random < cumulativeWeight) {
        return variant
      }
    }

    // Fallback to first variant
    return experiment.variants[0] ?? null
  }

  /**
   * Hash string
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * Track conversion
   */
  trackConversion(experimentId: string, variantId: string, userId: string): void {
    if (!this.enableTracking) {
      return
    }

    const conversions = this.conversions.get(experimentId)
    if (conversions) {
      const currentCount = conversions.get(variantId) ?? 0
      conversions.set(variantId, currentCount + 1)

      logger.debug('Conversion tracked', {
        experimentId,
        variantId,
        userId,
        count: currentCount + 1,
      })
    }
  }

  /**
   * Get experiment results
   */
  private calculateVariantResults(
    experiment: Experiment,
    conversions: Map<string, number>,
    visitors: Map<string, number>
  ): ExperimentResult['variantResults'] {
    return experiment.variants.map((variant) => {
      const variantConversions = conversions.get(variant.id) ?? 0
      const variantVisitors = visitors.get(variant.id) ?? 0
      const conversionRate = variantVisitors > 0 ? (variantConversions / variantVisitors) * 100 : 0

      const confidenceInterval = this.calculateConfidenceInterval(
        variantConversions,
        variantVisitors,
        experiment.significanceLevel ?? this.defaultSignificanceLevel
      )

      const isSignificant = this.isStatisticallySignificant(
        variantConversions,
        variantVisitors,
        experiment.significanceLevel ?? this.defaultSignificanceLevel
      )

      return {
        variant,
        conversions: variantConversions,
        visitors: variantVisitors,
        conversionRate,
        confidenceInterval,
        isSignificant,
      }
    })
  }

  private calculateOverallResult(
    variantResults: ExperimentResult['variantResults'],
    experiment: Experiment
  ): ExperimentResult['overallResult'] {
    if (variantResults.length === 0) {
      throw new Error('No variant results available')
    }
    
    const firstResult = variantResults[0];
    if (!firstResult) {
      throw new Error('No variant results available')
    }
    
    const winningVariant = variantResults.reduce((prev, current) => {
      return current.conversionRate > prev.conversionRate ? current : prev
    }, firstResult)

    const totalConversions = variantResults.reduce((sum, result) => sum + result.conversions, 0)
    const totalVisitors = variantResults.reduce((sum, result) => sum + result.visitors, 0)

    const statisticalSignificance = this.calculateStatisticalSignificance(
      variantResults,
      experiment.significanceLevel ?? this.defaultSignificanceLevel
    )

    return {
      totalConversions,
      totalVisitors,
      winningVariant: winningVariant.variant.id,
      statisticalSignificance,
    }
  }

  getResults(experimentId: string): ExperimentResult | null {
    const experiment = this.experiments.get(experimentId)

    if (!experiment) {
      logger.warn('Experiment not found', { experimentId })
      return null
    }

    const conversions = this.conversions.get(experimentId)
    const visitors = this.visitors.get(experimentId)

    if (!conversions || !visitors) {
      return null
    }

    const variantResults = this.calculateVariantResults(experiment, conversions, visitors)
    const overallResult = this.calculateOverallResult(variantResults, experiment)

    return {
      experimentId,
      variantResults,
      overallResult,
    }
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    conversions: number,
    visitors: number,
    confidenceLevel: number
  ): [number, number] {
    if (visitors === 0) {
      return [0, 0]
    }

    const p = conversions / visitors
    const z = this.getZScore(confidenceLevel)
    const margin = z * Math.sqrt((p * (1 - p)) / visitors)

    return [Math.max(0, p - margin), Math.min(1, p + margin)]
  }

  /**
   * Get Z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    // Simplified Z-scores for common confidence levels
    if (confidenceLevel >= 0.99) {
      return 2.576
    } else if (confidenceLevel >= 0.95) {
      return 1.96
    } else if (confidenceLevel >= 0.90) {
      return 1.645
    } else {
      return 1.96
    }
  }

  /**
   * Check statistical significance
   */
  private isStatisticallySignificant(
    conversions: number,
    visitors: number,
    significanceLevel: number
  ): boolean {
    if (visitors === 0) {
      return false
    }

    // Simplified significance test
    const p = conversions / visitors
    const z = this.getZScore(significanceLevel)
    const margin = z * Math.sqrt((p * (1 - p)) / visitors)

    return margin < p * 0.1 // Simplified: margin should be less than 10% of conversion rate
  }

  /**
   * Calculate statistical significance
   */
  private calculateStatisticalSignificance(
    variantResults: {
      readonly conversions: number
      readonly visitors: number
      readonly conversionRate: number
    }[],
    significanceLevel: number
  ): number {
    // Simplified statistical significance calculation
    if (variantResults.length < 2) {
      return 0
    }

    const baseline = variantResults[0]
    const test = variantResults[1]

    if (!baseline || !test) {
      return 0
    }

    if (baseline.visitors === 0 || test.visitors === 0) {
      return 0
    }

    const p1 = baseline.conversions / baseline.visitors
    const p2 = test.conversions / test.visitors

    const pooledP = (baseline.conversions + test.conversions) / (baseline.visitors + test.visitors)
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / baseline.visitors + 1 / test.visitors))

    if (se === 0) {
      return 0
    }

    const z = Math.abs(p2 - p1) / se
    const zScore = this.getZScore(significanceLevel)

    return z > zScore ? significanceLevel : 0
  }

  /**
   * Get experiment
   */
  getExperiment(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) ?? null
  }

  /**
   * Update experiment status
   */
  updateExperimentStatus(experimentId: string, status: ExperimentStatus): void {
    const experiment = this.experiments.get(experimentId)
    if (experiment) {
      this.experiments.set(experimentId, { ...experiment, status })
      logger.debug('Experiment status updated', { experimentId, status })
    }
  }

  /**
   * Clear experiment data
   */
  clearExperimentData(experimentId: string): void {
    this.assignments.delete(experimentId)
    this.conversions.delete(experimentId)
    this.visitors.delete(experimentId)
    logger.debug('Experiment data cleared', { experimentId })
  }
}

/**
 * Create A/B tester instance
 */
let abTesterInstance: ABTester | null = null

export function getABTester(options?: ABTestingOptions): ABTester {
  abTesterInstance ??= new ABTester(options)
  return abTesterInstance
}
