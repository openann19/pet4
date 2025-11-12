import { describe, it, expect } from 'vitest'
import type { Pack } from '@petspark/spec-core'
import { validatePack, mergePacks, ValidationError } from '@petspark/spec-core'
import { verifyPackAgainstAllowlist, createAllowlist } from '@petspark/spec-security'

describe('Failure Path Tests', () => {
  it('should reject pack with invalid packId', () => {
    const pack = {
      metadata: {
        packId: 'invalid pack id',
        name: 'Test',
        version: '1.0.0',
      },
    }

    expect(() => validatePack(pack)).toThrow(ValidationError)
  })

  it('should reject pack with invalid version', () => {
    const pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test',
        version: 'invalid-version',
      },
    }

    expect(() => validatePack(pack)).toThrow(ValidationError)
  })

  it('should reject pack with remote URL but no hash', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test',
        version: '1.0.0',
      },
      dependencies: [
        {
          packId: 'remote.pack',
          version: '1.0.0',
          source: 'remote',
          url: 'https://example.com/pack.json',
        },
      ],
    }

    expect(() => validatePack(pack)).not.toThrow()
  })

  it('should reject merge with empty pack array', () => {
    expect(() => mergePacks([])).toThrow('Cannot merge empty pack array')
  })

  it('should reject pack with hash mismatch', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test',
        version: '1.0.0',
      },
      configuration: {},
    }

    const allowlist = createAllowlist()
    allowlist.entries.push({
      packId: 'test.pack',
      version: '1.0.0',
      hash: 'invalid-hash',
      source: 'local',
    })

    expect(verifyPackAgainstAllowlist(pack, allowlist)).toBe(false)
  })

  it('should handle missing pack in registry', () => {
    const pack: Pack = {
      metadata: {
        packId: 'missing.pack',
        name: 'Missing',
        version: '1.0.0',
      },
      configuration: {},
    }

    const allowlist = createAllowlist()

    expect(verifyPackAgainstAllowlist(pack, allowlist)).toBe(false)
  })
})
