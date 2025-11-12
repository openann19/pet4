/**
 * Business Config API (Mobile)
 *
 * API client for business configuration management.
 */

import { apiClient } from '../utils/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('BusinessConfigAPI');

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
      rollout: number;
      params: Record<string, unknown>;
    }
  >;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Get business configuration
 */
export async function getBusinessConfig(): Promise<BusinessConfig | null> {
  try {
    const response = await apiClient.get<{ config: BusinessConfig | null }>(
      '/v1/payments/business-config'
    );
    // Response is already unwrapped by apiClient (handles { data: { config: ... } })
    if ('config' in response) {
      return response.config;
    }
    // Fallback: if response is direct config object
    return (response as unknown as BusinessConfig) || null;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get business config', err);
    throw err;
  }
}

/**
 * Update business configuration
 */
export async function updateBusinessConfig(
  config: BusinessConfig,
  updatedBy: string
): Promise<BusinessConfig> {
  try {
    const response = await apiClient.put<{ config: BusinessConfig }>(
      '/v1/payments/business-config',
      {
        config,
        updatedBy,
      }
    );
    // Response is already unwrapped by apiClient (handles { data: { config: ... } })
    if ('config' in response) {
      return response.config;
    }
    // Fallback: if response is direct config object
    return response as unknown as BusinessConfig;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update business config', err, { updatedBy });
    throw err;
  }
}
