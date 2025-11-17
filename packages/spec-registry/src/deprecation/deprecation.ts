import type { RegistryEntry } from '@petspark/spec-core'

/**
 * Mark pack version as deprecated
 */
export function markDeprecated(
  entry: RegistryEntry,
  version: string,
  notice?: string
): void {
  const versionEntry = entry.versions.find((v) => v.version === version)
  if (versionEntry) {
    versionEntry.deprecated = true
    if (notice) {
      versionEntry.deprecationNotice = notice
    }
  }
}

/**
 * Check if pack version is deprecated
 */
export function isDeprecated(entry: RegistryEntry, version: string): boolean {
  const versionEntry = entry.versions.find((v) => v.version === version)
  return versionEntry?.deprecated ?? false
}

/**
 * Get deprecation notice for pack version
 */
export function getDeprecationNotice(
  entry: RegistryEntry,
  version: string
): string | undefined {
  const versionEntry = entry.versions.find((v) => v.version === version)
  return versionEntry?.deprecationNotice
}
