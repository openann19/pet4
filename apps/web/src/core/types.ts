/**
 * Core domain types with strict optional handling
 * 
 * These types enforce exact optional semantics where undefined must be explicit.
 * Use OptionalWithUndef<T> when you need to distinguish between omitted and undefined.
 */

import type { OptionalWithUndef } from '@/types/optional-with-undef'

/**
 * Base entity with timestamps
 */
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

/**
 * Update operation data
 * Use this for operations where undefined explicitly means "clear this field"
 */
export type UpdateEntity<T extends BaseEntity> = OptionalWithUndef<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>

/**
 * Patch operation data
 * Allows partial updates with explicit undefined support
 */
export type PatchEntity<T extends BaseEntity> = Partial<UpdateEntity<T>>

