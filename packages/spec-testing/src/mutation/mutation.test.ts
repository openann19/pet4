import { describe, it, expect } from 'vitest'
import type { Pack } from '@petspark/spec-core'
import { validatePack, mergePacks } from '@petspark/spec-core'

describe('Mutation Tests', () => {
  it('should handle mutation of pack metadata', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test Pack',
        version: '1.0.0',
      },
      configuration: {},
    }

    const validated = validatePack(pack)

    validated.metadata.name = 'Mutated Name'

    expect(validated.metadata.name).toBe('Mutated Name')
  })

  it('should handle mutation of configuration', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test Pack',
        version: '1.0.0',
      },
      configuration: {
        env: {
          VAR1: 'value1',
        },
      },
    }

    const merged = mergePacks([pack])

    if (merged.configuration.env) {
      merged.configuration.env.VAR1 = 'mutated-value'
    }

    expect(merged.configuration.env?.VAR1).toBe('mutated-value')
  })

  it('should validate after mutation', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test Pack',
        version: '1.0.0',
      },
      configuration: {},
    }

    const validated = validatePack(pack)

    validated.metadata.version = '2.0.0'

    expect(() => validatePack(validated)).not.toThrow()
  })
})
