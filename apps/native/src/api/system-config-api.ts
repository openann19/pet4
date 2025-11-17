/**
 * System Config API (Mobile)
 *
 * API client for system configuration management.
 */

import { apiClient } from '../utils/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('SystemConfigAPI');

export interface FeatureFlags {
  enableChat: boolean;
  enableVisualAnalysis: boolean;
  enableMatching: boolean;
  enableReporting: boolean;
  enableVerification: boolean;
}

export interface SystemSettings {
  maxReportsPerUser: number;
  autoModeration: boolean;
  requireVerification: boolean;
  matchDistanceRadius: number;
  messagingEnabled: boolean;
}

export interface SystemConfig {
  featureFlags: FeatureFlags;
  systemSettings: SystemSettings;
  maintenanceMode?: boolean;
  registrationEnabled?: boolean;
  moderationEnabled?: boolean;
}

/**
 * Get system configuration
 */
export async function getSystemConfig(): Promise<SystemConfig | null> {
  try {
    const response = await apiClient.get<{ config: SystemConfig | null }>(
      '/v1/admin/config/system'
    );
    // Response is already unwrapped by apiClient (handles { data: { config: ... } })
    if ('config' in response) {
      return response.config;
    }
    // Fallback: if response is direct config object
    return (response as unknown as SystemConfig) || null;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get system config', err);
    throw err;
  }
}

/**
 * Update system configuration
 */
export async function updateSystemConfig(
  config: SystemConfig,
  updatedBy: string
): Promise<SystemConfig> {
  try {
    const response = await apiClient.put<{ config: SystemConfig }>(
      '/v1/admin/config/system',
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
    return response as unknown as SystemConfig;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update system config', err, { updatedBy });
    throw err;
  }
}

