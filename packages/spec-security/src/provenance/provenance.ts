import { createHash } from 'crypto'
import type { Pack, MergedSpec } from '@petspark/spec-core'
import { computePackHash } from '@petspark/spec-core'

/**
 * Provenance metadata
 */
export interface Provenance {
  issuedBy: string
  reviewedAt?: string
  checksums: Record<string, string>
}

/**
 * Create provenance metadata for packs
 */
export function createProvenance(
  packs: Pack[],
  issuedBy: string,
  reviewedAt?: string
): Provenance {
  const checksums: Record<string, string> = {}

  for (const pack of packs) {
    const hash = computePackHash(pack)
    checksums[pack.metadata.packId] = hash
  }

  return {
    issuedBy,
    reviewedAt: reviewedAt ?? new Date().toISOString(),
    checksums,
  }
}

/**
 * Create provenance metadata for merged spec
 */
export function createMergedSpecProvenance(
  mergedSpec: MergedSpec,
  issuedBy: string,
  reviewedAt?: string
): Provenance {
  const checksums: Record<string, string> = {}

  for (const pack of mergedSpec.packs) {
    checksums[pack.packId] = pack.hash
  }

  if (mergedSpec.metadata.hash) {
    checksums['merged'] = mergedSpec.metadata.hash
  }

  return {
    issuedBy,
    reviewedAt: reviewedAt ?? new Date().toISOString(),
    checksums,
  }
}

/**
 * Compute SHA-256 hash of data
 */
export function computeHash(data: string | Uint8Array): string {
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : data
  return createHash('sha256').update(dataBytes).digest('hex')
}

/**
 * Verify provenance checksums
 */
export function verifyProvenanceChecksums(
  provenance: Provenance,
  packs: Pack[]
): boolean {
  for (const pack of packs) {
    const expectedHash = provenance.checksums[pack.metadata.packId]
    if (!expectedHash) {
      return false
    }

    const actualHash = computePackHash(pack)
    if (actualHash !== expectedHash) {
      return false
    }
  }

  return true
}
