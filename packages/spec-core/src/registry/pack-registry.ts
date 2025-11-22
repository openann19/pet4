import type { Pack, PackDependency } from '../schemas/pack-schema.js'
import { validatePackId, validateVersion } from '../validation/validator.js'

/**
 * Pack registry entry
 */
export interface RegistryEntry {
  packId: string
  name: string
  description?: string
  versions: Array<{
    version: string
    hash: string
    publishedAt: string
    deprecated?: boolean
    deprecationNotice?: string
  }>
  tags?: string[]
  author?: string
  license?: string
  homepage?: string
  repository?: string
  changelog?: Array<{
    version: string
    date: string
    changes: string[]
  }>
  semverRules?: {
    major?: string[]
    minor?: string[]
    patch?: string[]
  }
}

/**
 * Pack registry index
 */
export interface RegistryIndex {
  version: string
  updatedAt: string
  packs: RegistryEntry[]
}

/**
 * Create a new registry index
 */
export function createRegistryIndex(): RegistryIndex {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    packs: [],
  }
}

/**
 * Add a pack to the registry
 */
export function addPackToRegistry(
  registry: RegistryIndex,
  pack: Pack,
  hash: string
): void {
  if (!validatePackId(pack.metadata.packId)) {
    throw new Error(`Invalid pack ID: ${pack.metadata.packId}`)
  }

  if (!validateVersion(pack.metadata.version)) {
    throw new Error(`Invalid version: ${pack.metadata.version}`)
  }

  const existingIndex = registry.packs.findIndex(
    (p) => p.packId === pack.metadata.packId
  )

  const versionEntry = {
    version: pack.metadata.version,
    hash,
    publishedAt: new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    const existing = registry.packs[existingIndex]
    if (!existing) {
      throw new Error(`Pack not found at index ${existingIndex}`)
    }

    const versionExists = existing.versions.some(
      (v) => v.version === pack.metadata.version
    )

    if (!versionExists) {
      existing.versions.push(versionEntry)
      existing.versions.sort((a, b) => {
        const aParts = a.version.split('.').map(Number)
        const bParts = b.version.split('.').map(Number)

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aPart = aParts[i] ?? 0
          const bPart = bParts[i] ?? 0

          if (aPart !== bPart) {
            return bPart - aPart
          }
        }

        return 0
      })
    }

    if (pack.metadata.name) {
      existing.name = pack.metadata.name
    }
    if (pack.metadata.description) {
      existing.description = pack.metadata.description
    }
    if (pack.metadata.tags) {
      existing.tags = pack.metadata.tags
    }
    if (pack.metadata.author) {
      existing.author = pack.metadata.author
    }
    if (pack.metadata.license) {
      existing.license = pack.metadata.license
    }
    if (pack.metadata.homepage) {
      existing.homepage = pack.metadata.homepage
    }
    if (pack.metadata.repository) {
      existing.repository = pack.metadata.repository
    }
  } else {
    registry.packs.push({
      packId: pack.metadata.packId,
      name: pack.metadata.name,
      description: pack.metadata.description,
      versions: [versionEntry],
      tags: pack.metadata.tags,
      author: pack.metadata.author,
      license: pack.metadata.license,
      homepage: pack.metadata.homepage,
      repository: pack.metadata.repository,
    })
  }

  registry.updatedAt = new Date().toISOString()
  registry.packs.sort((a, b) => a.packId.localeCompare(b.packId))
}

/**
 * Find a pack in the registry
 */
export function findPackInRegistry(
  registry: RegistryIndex,
  packId: string,
  version?: string
): RegistryEntry | undefined {
  const entry = registry.packs.find((p) => p.packId === packId)

  if (!entry) {
    return undefined
  }

  if (version) {
    const versionEntry = entry.versions.find((v) => v.version === version)
    if (!versionEntry) {
      return undefined
    }
  }

  return entry
}

/**
 * Get latest version of a pack from registry
 */
export function getLatestPackVersion(
  registry: RegistryIndex,
  packId: string
): string | undefined {
  const entry = findPackInRegistry(registry, packId)

  if (!entry || entry.versions.length === 0) {
    return undefined
  }

  return entry.versions[0]?.version
}

/**
 * Check if a pack version is deprecated
 */
export function isPackDeprecated(
  registry: RegistryIndex,
  packId: string,
  version: string
): boolean {
  const entry = findPackInRegistry(registry, packId, version)

  if (!entry) {
    return false
  }

  const versionEntry = entry.versions.find((v) => v.version === version)
  return versionEntry?.deprecated ?? false
}

/**
 * Resolve pack dependencies using registry
 */
export function resolveDependencies(
  registry: RegistryIndex,
  dependencies: PackDependency[]
): Array<{
  packId: string
  version: string
  hash: string
  resolved: boolean
}> {
  const resolved: Array<{
    packId: string
    version: string
    hash: string
    resolved: boolean
  }> = []

  for (const dep of dependencies) {
    const entry = findPackInRegistry(registry, dep.packId, dep.version)

    if (entry) {
      const versionEntry = entry.versions.find((v) => v.version === dep.version)
      if (versionEntry) {
        resolved.push({
          packId: dep.packId,
          version: dep.version,
          hash: versionEntry.hash,
          resolved: true,
        })
      } else {
        resolved.push({
          packId: dep.packId,
          version: dep.version,
          hash: dep.hash ?? '',
          resolved: false,
        })
      }
    } else {
      resolved.push({
        packId: dep.packId,
        version: dep.version,
        hash: dep.hash ?? '',
        resolved: false,
      })
    }
  }

  return resolved
}
