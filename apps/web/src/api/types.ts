/**
 * Core API types for strict optional handling
 *
 * These types use OptionalWithUndef<T> to explicitly allow undefined values
 * in update/patch operations, distinguishing between:
 * - Omitted property (not present)
 * - Property set to undefined (intentionally cleared)
 */

import type { OptionalWithUndef } from '@/types/optional-with-undef';
import type { CreateAdoptionListingData } from '@/lib/adoption-marketplace-types';
import type { OwnerPreferences } from '@/core/domain/pet-model';
import type { MatchingConfig } from '@/core/domain/matching-config';
import type { Post } from '@/lib/community-types';

/**
 * Update data for adoption listings
 * Allows explicit undefined to clear fields
 */
export type UpdateAdoptionListingData = OptionalWithUndef<
  Omit<CreateAdoptionListingData, 'petId' | 'ownerId'>
>;

/**
 * Partial update for adoption listings
 * Use this for PATCH operations where undefined means "clear this field"
 */
export type PatchAdoptionListingData = Partial<UpdateAdoptionListingData>;

/**
 * Update data for owner preferences
 * Allows explicit undefined to clear preference fields
 */
export type UpdateOwnerPreferencesData = OptionalWithUndef<
  Omit<OwnerPreferences, 'ownerId' | 'updatedAt'>
>;

/**
 * Update data for matching configuration
 * Allows explicit undefined to clear config fields
 */
export type UpdateMatchingConfigData = OptionalWithUndef<
  Omit<MatchingConfig, 'id' | 'updatedAt' | 'updatedBy'>
>;

/**
 * Update data for community posts
 * Allows explicit undefined to clear post fields
 */
export type UpdatePostData = OptionalWithUndef<
  Omit<
    Post,
    | 'id'
    | 'authorId'
    | 'createdAt'
    | 'updatedAt'
    | 'publishedAt'
    | 'viewsCount'
    | 'reactionsCount'
    | 'commentsCount'
    | 'sharesCount'
  >
>;
