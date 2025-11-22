import { readFile, writeFile, ensureDir } from 'fs-extra'
import { dirname } from 'path'
import { glob } from 'glob'
import type { Pack, MergedSpec } from '@petspark/spec-core'
import { validatePack, mergePacks } from '@petspark/spec-core'
import type { SpecLogger } from '@petspark/spec-observability'
import { createLogger } from '@petspark/spec-observability'

export interface MergeOptions {
  input: string[]
  output: string
  lockFile?: string
  logger?: SpecLogger
}

/**
 * Load pack from file
 */
async function loadPack(filePath: string): Promise<Pack> {
  const content = await readFile(filePath, 'utf-8')
  const pack = JSON.parse(content) as unknown
  return validatePack(pack)
}

/**
 * Load packs from glob patterns
 */
async function loadPacksFromPatterns(patterns: string[]): Promise<Pack[]> {
  const packs: Pack[] = []

  for (const pattern of patterns) {
    const files = await glob(pattern, { absolute: true })
    for (const file of files) {
      try {
        const pack = await loadPack(file)
        packs.push(pack)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        throw new Error(`Failed to load pack from ${file}: ${err.message}`)
      }
    }
  }

  return packs
}

/**
 * Merge packs command
 */
export async function mergeCommand(options: MergeOptions): Promise<MergedSpec> {
  const startTime = Date.now()
  const logger = options.logger ?? createLogger()

  logger.info('Starting pack merge', {
    input: options.input,
    output: options.output,
  })

  try {
    const packs = await loadPacksFromPatterns(options.input)

    if (packs.length === 0) {
      throw new Error('No packs found matching input patterns')
    }

    logger.info('Loaded packs', {
      count: packs.length,
      packIds: packs.map((p) => p.metadata.packId),
    })

    const mergedSpec = mergePacks(packs, startTime)

    logger.info('Merged packs', {
      duration: mergedSpec.metadata.mergeDuration,
      totalPacks: mergedSpec.metadata.totalPacks,
      hash: mergedSpec.metadata.hash,
    })

    await ensureDir(dirname(options.output))
    await writeFile(options.output, JSON.stringify(mergedSpec, null, 2), 'utf-8')

    logger.info('Wrote merged spec', {
      output: options.output,
    })

    return mergedSpec
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Merge failed', {
      error: err.message,
      stack: err.stack,
    })
    throw err
  }
}
