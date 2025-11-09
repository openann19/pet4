/**
 * API Config API
 *
 * API client for API configuration management (keys, endpoints, etc.).
 */

import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

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
    const response = await APIClient.get<{ config: APIConfig | null }>('/admin/config/api');
    return response.data.config;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get API config', err);
    throw err;
  }
}

/**
 * Update API configuration
 */
export async function updateAPIConfig(
  config: APIConfig,
  updatedBy: string
): Promise<APIConfig> {
  try {
    const response = await APIClient.put<{ config: APIConfig }>('/admin/config/api', {
      config,
      updatedBy,
    });
    return response.data.config;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update API config', err, { updatedBy });
    throw err;
  }
}

/**
 * API Config API service object
 */
export const apiConfigApi = {
  getAPIConfig,
  updateAPIConfig,
};
