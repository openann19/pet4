import type { Pack } from '@petspark/spec-core'
import { computePackHash } from '@petspark/spec-core'
import { validateHash } from '@petspark/spec-core'

/**
 * Allowlist entry
 */
export interface AllowlistEntry {
  packId: string
  version: string
  hash: string
  source: 'local' | 'remote' | 'registry'
  url?: string
}

/**
 * Pack registry allowlist
 */
export interface Allowlist {
  version: string
  updatedAt: string
  entries: AllowlistEntry[]
}

/**
 * Create a new allowlist
 */
export function createAllowlist(): Allowlist {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    entries: [],
  }
}

/**
 * Add pack to allowlist
 */
export function addToAllowlist(
  allowlist: Allowlist,
  pack: Pack,
  source: 'local' | 'remote' | 'registry',
  url?: string
): void {
  const hash = computePackHash(pack)

  const entry: AllowlistEntry = {
    packId: pack.metadata.packId,
    version: pack.metadata.version,
    hash,
    source,
    url,
  }

  const existingIndex = allowlist.entries.findIndex(
    (e) => e.packId === pack.metadata.packId && e.version === pack.metadata.version
  )

  if (existingIndex >= 0) {
    allowlist.entries[existingIndex] = entry
  } else {
    allowlist.entries.push(entry)
  }

  allowlist.updatedAt = new Date().toISOString()
  allowlist.entries.sort((a, b) => {
    if (a.packId !== b.packId) {
      return a.packId.localeCompare(b.packId)
    }
    return a.version.localeCompare(b.version)
  })
}

/**
 * Verify pack against allowlist
 */
export function verifyPackAgainstAllowlist(
  pack: Pack,
  allowlist: Allowlist
): boolean {
  const entry = allowlist.entries.find(
    (e) => e.packId === pack.metadata.packId && e.version === pack.metadata.version
  )

  if (!entry) {
    return false
  }

  if (!validateHash(entry.hash)) {
    return false
  }

  const actualHash = computePackHash(pack)
  return actualHash === entry.hash
}

/**
 * Verify pack hash matches expected hash
 */
export function verifyPackHash(pack: Pack, expectedHash: string): boolean {
  if (!validateHash(expectedHash)) {
    return false
  }

  const actualHash = computePackHash(pack)
  return actualHash === expectedHash
}

/**
 * Find pack in allowlist
 */
export function findPackInAllowlist(
  allowlist: Allowlist,
  packId: string,
  version: string
): AllowlistEntry | undefined {
  return allowlist.entries.find(
    (e) => e.packId === packId && e.version === version
  )
}
