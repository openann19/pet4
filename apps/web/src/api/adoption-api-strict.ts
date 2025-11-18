/**
 * Adoption API with strict optional handling
 *
 * This is an example of how to use OptionalWithUndef<T> in API layer
 * for update/patch operations where undefined explicitly means "clear this field".
 *
 * @example
 * ```ts
 * // Clear a field explicitly
 * await api.updateListing(id, { fee: undefined }, ownerId)
 *
 * // Omit a field (don't change it)
 * await api.updateListing(id, { petName: "New Name" }, ownerId)
 * ```
 */

import type { UpdateAdoptionListingData } from '@/api/types';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdoptionAPIStrict');

/**
 * Adoption API with strict optional semantics
 *
 * Uses OptionalWithUndef<T> to distinguish between:
 * - Omitted property: field is not updated
 * - Undefined value: field is explicitly cleared
 */
export class AdoptionAPIStrict {
  /**
   * PUT /adoption/listings/:id
   * Update listing with strict optional handling
   *
   * @param id - Listing ID
   * @param data - Update data (undefined values explicitly clear fields)
   * @param ownerId - Owner ID for authorization
   */
  async updateListing(
    id: string,
    data: UpdateAdoptionListingData,
    ownerId: string
  ): Promise<AdoptionListing> {
    try {
      const response = await APIClient.put<{ listing: AdoptionListing }>(
        ENDPOINTS.ADOPTION.UPDATE_LISTING(id),
        {
          ...data,
          ownerId,
        }
      );
      return response.data.listing;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to update listing', err, { id, ownerId });
      throw err;
    }
  }
}
