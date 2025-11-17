import { writeFile, ensureDir } from 'fs-extra'
import { dirname } from 'path'
import type { Pack } from '@petspark/spec-core'
import { PackSchema } from '@petspark/spec-core'

export interface NewPackOptions {
  packId: string
  name: string
  version: string
  output: string
  description?: string
  author?: string
  license?: string
  tags?: string[]
}

/**
 * New pack command - scaffold a new pack
 */
export async function newPackCommand(
  options: NewPackOptions
): Promise<Pack> {
  const pack: Pack = {
    metadata: {
      packId: options.packId,
      name: options.name,
      version: options.version,
      description: options.description,
      author: options.author,
      license: options.license,
      tags: options.tags,
      createdAt: new Date().toISOString(),
    },
    dependencies: [],
    configuration: {},
  }

  PackSchema.parse(pack)

  await ensureDir(dirname(options.output))
  await writeFile(options.output, JSON.stringify(pack, null, 2), 'utf-8')

  return pack
}
