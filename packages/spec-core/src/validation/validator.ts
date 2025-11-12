import { z } from 'zod'
import type { Pack, MergedSpec, LockFile } from '../schemas/pack-schema.js'
import {
  PackSchema,
  MergedSpecSchema,
  LockFileSchema,
} from '../schemas/pack-schema.js'

/**
 * Validation error with detailed information
 */
export class ValidationError extends Error {
  public readonly errors: z.ZodError

  constructor(
    message: string,
    errors: z.ZodError
  ) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

/**
 * Validate a pack against the schema
 */
export function validatePack(pack: unknown): Pack {
  try {
    return PackSchema.parse(pack)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Pack validation failed', error)
    }
    throw error
  }
}

/**
 * Validate a merged spec against the schema
 */
export function validateMergedSpec(spec: unknown): MergedSpec {
  try {
    return MergedSpecSchema.parse(spec)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Merged spec validation failed', error)
    }
    throw error
  }
}

/**
 * Validate a lock file against the schema
 */
export function validateLockFile(lockFile: unknown): LockFile {
  try {
    return LockFileSchema.parse(lockFile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Lock file validation failed', error)
    }
    throw error
  }
}

/**
 * Validate pack ID format
 */
export function validatePackId(packId: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(packId)
}

/**
 * Validate version format (semver)
 */
export function validateVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-z0-9-]+)?(\+[a-z0-9-]+)?$/i.test(version)
}

/**
 * Validate hash format (SHA-256 hex)
 */
export function validateHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}
