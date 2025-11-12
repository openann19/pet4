import type { RegistryEntry } from '@petspark/spec-core'

/**
 * Add changelog entry to registry entry
 */
export function addChangelogEntry(
  entry: RegistryEntry,
  version: string,
  changes: string[]
): void {
  if (!entry.changelog) {
    entry.changelog = []
  }

  entry.changelog.push({
    version,
    date: new Date().toISOString(),
    changes,
  })

  entry.changelog.sort((a, b) => {
    if (a.version !== b.version) {
      return b.version.localeCompare(a.version)
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

/**
 * Get changelog for pack
 */
export function getChangelog(entry: RegistryEntry): Array<{
  version: string
  date: string
  changes: string[]
}> {
  return entry.changelog ?? []
}

/**
 * Get changelog for specific version
 */
export function getChangelogForVersion(
  entry: RegistryEntry,
  version: string
): Array<{
  version: string
  date: string
  changes: string[]
}> {
  return entry.changelog?.filter((entry) => entry.version === version) ?? []
}
