import { readFile, writeFile, ensureDir } from 'fs-extra'
import { dirname } from 'path'
import type { LockFile } from '@petspark/spec-core'
import { validateMergedSpec } from '@petspark/spec-core'
import type { KeyPair } from '@petspark/spec-security'
import { signLockFile, loadKeyPair } from '@petspark/spec-security'
import { createMergedSpecProvenance } from '@petspark/spec-security'
import type { SpecLogger } from '@petspark/spec-observability'
import { createLogger } from '@petspark/spec-observability'

export interface LockOptions {
  mergedSpec: string
  output: string
  issuedBy: string
  reviewedAt?: string
  keyPair?: KeyPair
  logger?: SpecLogger
}

/**
 * Lock command - generate lock file with signatures
 */
export async function lockCommand(options: LockOptions): Promise<LockFile> {
  const logger = options.logger ?? createLogger()
  const startTime = Date.now()

  logger.info('Starting lock file generation', {
    mergedSpec: options.mergedSpec,
    output: options.output,
  })

  try {
    const content = await readFile(options.mergedSpec, 'utf-8')
    const mergedSpec = validateMergedSpec(JSON.parse(content) as unknown)

    const lockedAt = new Date().toISOString()

    let signatures: Array<{
      packId: string
      signature: string
      publicKey: string
      algorithm: 'ed25519'
    }> | undefined
    let keyPair = options.keyPair

    keyPair ??= await loadKeyPair()

    if (keyPair) {
      const signature = await signLockFile(content, keyPair)
      signatures = [
        {
          packId: 'lockfile',
          signature: signature.signature,
          publicKey: signature.publicKey,
          algorithm: 'ed25519',
        },
      ]

      logger.info('Signed lock file', {
        algorithm: signature.algorithm,
        timestamp: signature.timestamp,
      })
    } else {
      logger.warn('No key pair available, skipping signature')
    }

    const provenance = createMergedSpecProvenance(
      mergedSpec,
      options.issuedBy,
      options.reviewedAt
    )

    const lockFile: LockFile = {
      version: '1.0.0',
      lockedAt,
      mergedSpec,
      signatures,
      provenance,
    }

    await ensureDir(dirname(options.output))
    await writeFile(options.output, JSON.stringify(lockFile, null, 2), 'utf-8')

    const duration = Date.now() - startTime

    logger.info('Wrote lock file', {
      output: options.output,
      duration,
      signed: signatures !== undefined,
    })

    return lockFile
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Lock failed', {
      error: err.message,
      stack: err.stack,
    })
    throw err
  }
}
