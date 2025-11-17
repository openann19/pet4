/**
 * API Config API (Mobile)
 *
 * API client for API configuration management.
 */

import { apiClient } from '../utils/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('APIConfigAPI');

export interface APIConfig {
  maps: {
    provider: string;
    apiKey: string;
    enabled: boolean;
    rateLimit: number;
  };
  ai: {
    provider: string;
    apiKey: string;
    model: string;
    enabled: boolean;
    maxTokens: number;
    temperature: number;
  };
  kyc: {
    provider: string;
    apiKey: string;
    enabled: boolean;
    autoApprove: boolean;
    requireDocuments: boolean;
  };
  photoModeration: {
    provider: string;
    apiKey: string;
    enabled: boolean;
    autoReject: boolean;
    confidenceThreshold: number;
  };
  sms: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    enabled: boolean;
    fromNumber: string;
  };
  email: {
    provider: string;
    apiKey: string;
    enabled: boolean;
    fromEmail: string;
    fromName: string;
  };
  storage: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    bucket: string;
    region: string;
    enabled: boolean;
  };
  analytics: {
    provider: string;
    apiKey: string;
    enabled: boolean;
  };
  livekit: {
    apiKey: string;
    apiSecret: string;
    wsUrl: string;
    enabled: boolean;
  };
}

/**
 * Get API configuration
 */
export async function getAPIConfig(): Promise<APIConfig | null> {
  try {
    const response = await apiClient.get<{ config: APIConfig | null }>('/v1/admin/config/api');
    if ('config' in response) {
      return response.config;
    }
    return (response as unknown as APIConfig) || null;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get API config', err);
    throw err;
  }
}

/**
 * Update API configuration
 */
export async function updateAPIConfig(config: APIConfig, updatedBy: string): Promise<APIConfig> {
  try {
    const response = await apiClient.put<{ config: APIConfig }>('/v1/admin/config/api', {
      config,
      updatedBy,
    });
    if ('config' in response) {
      return response.config;
    }
    return response as unknown as APIConfig;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update API config', err, { updatedBy });
    throw err;
  }
}
