/**
 * API Config API Service
 * 
 * Handles API configuration retrieval through backend API.
 */

import { APIClient } from '@/lib/api-client'
import type { APIConfig } from '@/components/admin/APIConfigView'
import { createLogger } from '@/lib/logger'

const logger = createLogger('APIConfigAPI')

export interface GetAPIConfigResponse {
  config: APIConfig
}

class APIConfigApiImpl {
  /**
   * GET /api-config
   * Get API configuration
   */
  async getAPIConfig(): Promise<APIConfig | null> {
    try {
      const response = await APIClient.get<GetAPIConfigResponse>(
        '/api-config'
      )
      return response.data.config
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get API config', err)
      return null
    }
  }
}

export const apiConfigApi = new APIConfigApiImpl()

