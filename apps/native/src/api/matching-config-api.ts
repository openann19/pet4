/**
 * Matching Config API (Mobile)
 *
 * API client for matching configuration management.
 */

import { apiClient } from '../utils/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('MatchingConfigAPI');

export interface MatchingWeights {
  temperamentFit: number;
  energyLevelFit: number;
  lifeStageProximity: number;
  sizeCompatibility: number;
  speciesBreedCompatibility: number;
  socializationCompatibility: number;
  intentMatch: number;
  distance: number;
  healthVaccinationBonus: number;
}

export interface HardGatesConfig {
  requireVaccination: boolean;
  requireSpayNeuter: boolean;
  requireAgeVerification: boolean;
  maxDistanceKm: number;
  minAgeMonths: number;
  maxAgeMonths: number;
}

export interface FeatureFlags {
  MATCH_ALLOW_CROSS_SPECIES: boolean;
  MATCH_REQUIRE_VACCINATION: boolean;
  MATCH_DISTANCE_MAX_KM: number;
  MATCH_AB_TEST_KEYS: string[];
  MATCH_AI_HINTS_ENABLED: boolean;
}

export interface MatchingConfig {
  id: string;
  weights: MatchingWeights;
  hardGates: HardGatesConfig;
  featureFlags: FeatureFlags;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Get matching configuration
 */
export async function getMatchingConfig(): Promise<MatchingConfig | null> {
  try {
    const response = await apiClient.get<{ config: MatchingConfig | null }>(
      '/v1/matching/config'
    );
    if ('config' in response) {
      return response.config;
    }
    return (response as unknown as MatchingConfig) || null;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get matching config', err);
    throw err;
  }
}

/**
 * Update matching configuration
 */
export async function updateMatchingConfig(
  config: MatchingConfig,
  updatedBy: string
): Promise<MatchingConfig> {
  try {
    const response = await apiClient.put<{ config: MatchingConfig }>('/v1/matching/config', {
      config: {
        weights: config.weights,
        hardGates: config.hardGates,
        featureFlags: config.featureFlags,
      },
      updatedBy,
    });
    if ('config' in response) {
      return response.config;
    }
    return response as unknown as MatchingConfig;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update matching config', err, { updatedBy });
    throw err;
  }
}
