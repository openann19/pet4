/**
 * Feature Flags API Service
 * 
 * Handles feature flags and A/B tests through backend API.
 */

import { APIClient } from '@/lib/api-client'
import type { FeatureFlag, FeatureFlagKey, ABTest, ABTestVariant } from '@/lib/feature-flags'
import { createLogger } from '@/lib/logger'

const logger = createLogger('FeatureFlagsAPI')

export interface GetFeatureFlagsResponse {
  flags: Record<FeatureFlagKey, FeatureFlag>
}

export interface UpdateFeatureFlagRequest {
  updates: Partial<FeatureFlag>
  modifiedBy: string
}

export interface GetABTestResponse {
  test: ABTest | null
}

export interface GetABTestVariantResponse {
  variant: ABTestVariant | null
}

export interface TrackABTestExposureRequest {
  testId: string
  userId: string
  variantId: string
}

class FeatureFlagsApiImpl {
  /**
   * GET /feature-flags
   * Get all feature flags
   */
  async getFeatureFlags(): Promise<Record<FeatureFlagKey, FeatureFlag>> {
    try {
      const response = await APIClient.get<GetFeatureFlagsResponse>(
        '/feature-flags'
      )
      return response.data.flags
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get feature flags', err)
      throw err
    }
  }

  /**
   * PATCH /feature-flags/:key
   * Update feature flag
   */
  async updateFeatureFlag(
    flagKey: FeatureFlagKey,
    updates: Partial<FeatureFlag>,
    modifiedBy: string
  ): Promise<FeatureFlag> {
    try {
      const request: UpdateFeatureFlagRequest = {
        updates,
        modifiedBy
      }

      const response = await APIClient.patch<{ flag: FeatureFlag }>(
        `/feature-flags/${String(flagKey ?? '')}`,
        request
      )
      return response.data.flag
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update feature flag', err, { flagKey })
      throw err
    }
  }

  /**
   * GET /ab-tests
   * Get all A/B tests
   */
  async getABTests(): Promise<ABTest[]> {
    try {
      const response = await APIClient.get<{ tests: ABTest[] }>(
        '/ab-tests'
      )
      return response.data.tests
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get A/B tests', err)
      throw err
    }
  }

  /**
   * GET /ab-tests/:testId/variant?userId=
   * Get A/B test variant for user
   */
  async getABTestVariant(testId: string, userId: string): Promise<ABTestVariant | null> {
    try {
      const response = await APIClient.get<GetABTestVariantResponse>(
        `/ab-tests/${String(testId ?? '')}/variant?userId=${String(userId ?? '')}`
      )
      return response.data.variant
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get A/B test variant', err, { testId, userId })
      throw err
    }
  }

  /**
   * POST /ab-tests/exposure
   * Track A/B test exposure
   */
  async trackABTestExposure(
    testId: string,
    userId: string,
    variantId: string
  ): Promise<void> {
    try {
      const request: TrackABTestExposureRequest = {
        testId,
        userId,
        variantId
      }

      await APIClient.post('/ab-tests/exposure', request)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to track A/B test exposure', err, { testId, userId, variantId })
      throw err
    }
  }
}

export const featureFlagsApi = new FeatureFlagsApiImpl()

