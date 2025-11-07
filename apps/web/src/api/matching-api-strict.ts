/**
 * Matching API with strict optional handling
 * 
 * This is an example of how to use OptionalWithUndef<T> in API layer
 * for update/patch operations where undefined explicitly means "clear this field".
 * 
 * @example
 * ```ts
 * // Clear a field explicitly
 * await api.updatePreferences({ maxDistanceKm: undefined, ownerId: 'user123' })
 * 
 * // Omit a field (don't change it)
 * await api.updatePreferences({ maxDistanceKm: 100, ownerId: 'user123' })
 * ```
 */

import type { UpdateOwnerPreferencesData, UpdateMatchingConfigData } from '@/api/types'
import type { OwnerPreferences } from '@/core/domain/pet-model'
import type { MatchingConfig } from '@/core/domain/matching-config'
import { APIClient } from '@/lib/api-client'
import { ENDPOINTS } from '@/lib/endpoints'
import { createLogger } from '@/lib/logger'

const logger = createLogger('MatchingAPIStrict')

/**
 * Matching API with strict optional semantics
 *
 * Uses OptionalWithUndef<T> to distinguish between:
 * - Omitted property: field is not updated
 * - Undefined value: field is explicitly cleared
 */
export class MatchingAPIStrict {

  /**
   * Update owner preferences with strict optional handling
   * 
   * @param ownerId - Owner ID
   * @param data - Update data (undefined values explicitly clear fields)
   */
  async updatePreferences(
    ownerId: string,
    data: UpdateOwnerPreferencesData
  ): Promise<OwnerPreferences> {
    try {
      const response = await APIClient.put<{ preferences: OwnerPreferences }>(
        ENDPOINTS.MATCHING.PREFERENCES,
        {
          ownerId,
          ...data
        }
      )
      return response.data.preferences
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update preferences', err, { ownerId })
      throw err
    }
  }

  /**
   * Update matching configuration with strict optional handling
   * 
   * @param data - Update data (undefined values explicitly clear fields)
   */
  async updateConfig(
    data: UpdateMatchingConfigData
  ): Promise<MatchingConfig> {
    try {
      const response = await APIClient.put<{ config: MatchingConfig }>(
        '/matching/config',
        data
      )
      return response.data.config
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update config', err)
      throw err
    }
  }
}

