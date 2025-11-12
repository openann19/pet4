import { readFile, writeFile } from 'fs-extra'
import type { Pack } from '@petspark/spec-core'
import { validatePack } from '@petspark/spec-core'
import type { RegistryIndex } from '@petspark/spec-core'
import {
  findPackInRegistry,
  getLatestPackVersion,
  isPackDeprecated,
} from '@petspark/spec-core'
import type { SpecLogger } from '@petspark/spec-observability'
import { createLogger } from '@petspark/spec-observability'

export interface MigrateOptions {
  packFile: string
  registryFile: string
  targetVersion?: string
  logger?: SpecLogger
}

/**
 * Migrate command - migrate pack using registry
 */
export async function migrateCommand(
  options: MigrateOptions
): Promise<Pack> {
  const logger = options.logger ?? createLogger()

  logger.info('Starting pack migration', {
    packFile: options.packFile,
    registryFile: options.registryFile,
    targetVersion: options.targetVersion,
  })

  try {
    const packContent = await readFile(options.packFile, 'utf-8')
    const pack = validatePack(JSON.parse(packContent) as unknown)

    const registryContent = await readFile(options.registryFile, 'utf-8')
    const registry = JSON.parse(registryContent) as RegistryIndex

    const entry = findPackInRegistry(
      registry,
      pack.metadata.packId,
      pack.metadata.version
    )

    if (!entry) {
      throw new Error(
        `Pack ${pack.metadata.packId}@${pack.metadata.version} not found in registry`
      )
    }

    if (isPackDeprecated(registry, pack.metadata.packId, pack.metadata.version)) {
      const versionEntry = entry.versions.find(
        (v) => v.version === pack.metadata.version
      )
      logger.warn('Pack is deprecated', {
        packId: pack.metadata.packId,
        version: pack.metadata.version,
        notice: versionEntry?.deprecationNotice,
      })
    }

    const targetVersion = options.targetVersion ?? getLatestPackVersion(registry, pack.metadata.packId)

    if (!targetVersion) {
      throw new Error(`No target version found for pack ${pack.metadata.packId}`)
    }

    const oldVersion = pack.metadata.version

    if (targetVersion === oldVersion) {
      logger.info('Pack is already at target version', {
        packId: pack.metadata.packId,
        version: oldVersion,
      })
      return pack
    }

    const targetEntry = findPackInRegistry(registry, pack.metadata.packId, targetVersion)

    if (!targetEntry) {
      throw new Error(
        `Target version ${targetVersion} not found for pack ${pack.metadata.packId}`
      )
    }

    pack.metadata.version = targetVersion

    await writeFile(options.packFile, JSON.stringify(pack, null, 2), 'utf-8')

    logger.info('Migrated pack', {
      packId: pack.metadata.packId,
      oldVersion,
      newVersion: targetVersion,
    })

    return pack
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Migration failed', {
      error: err.message,
      stack: err.stack,
    })
    throw err
  }
}
