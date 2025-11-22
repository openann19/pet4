import { readFile } from 'fs-extra'
import { validateMergedSpec } from '@petspark/spec-core'

export interface DiffOptions {
  oldSpec: string
  newSpec: string
}

export interface DiffResult {
  added: Array<{
    packId: string
    version: string
  }>
  removed: Array<{
    packId: string
    version: string
  }>
  updated: Array<{
    packId: string
    oldVersion: string
    newVersion: string
  }>
  unchanged: Array<{
    packId: string
    version: string
  }>
}

/**
 * Diff command - compare two merged specs
 */
export async function diffCommand(options: DiffOptions): Promise<DiffResult> {
  const oldContent = await readFile(options.oldSpec, 'utf-8')
  const newContent = await readFile(options.newSpec, 'utf-8')

  const oldSpec = validateMergedSpec(JSON.parse(oldContent) as unknown)
  const newSpec = validateMergedSpec(JSON.parse(newContent) as unknown)

  const oldPacksMap = new Map(
    oldSpec.packs.map((p) => [p.packId, p.version])
  )
  const newPacksMap = new Map(
    newSpec.packs.map((p) => [p.packId, p.version])
  )

  const added: Array<{ packId: string; version: string }> = []
  const removed: Array<{ packId: string; version: string }> = []
  const updated: Array<{ packId: string; oldVersion: string; newVersion: string }> = []
  const unchanged: Array<{ packId: string; version: string }> = []

  for (const [packId, newVersion] of newPacksMap.entries()) {
    const oldVersion = oldPacksMap.get(packId)

    if (!oldVersion) {
      added.push({ packId, version: newVersion })
    } else if (oldVersion !== newVersion) {
      updated.push({
        packId,
        oldVersion,
        newVersion,
      })
    } else {
      unchanged.push({ packId, version: newVersion })
    }
  }

  for (const [packId, oldVersion] of oldPacksMap.entries()) {
    if (!newPacksMap.has(packId)) {
      removed.push({ packId, version: oldVersion })
    }
  }

  return {
    added: added.sort((a, b) => a.packId.localeCompare(b.packId)),
    removed: removed.sort((a, b) => a.packId.localeCompare(b.packId)),
    updated: updated.sort((a, b) => a.packId.localeCompare(b.packId)),
    unchanged: unchanged.sort((a, b) => a.packId.localeCompare(b.packId)),
  }
}
