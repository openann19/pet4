import { describe, it, expect } from 'vitest'
import type { Pack } from '@petspark/spec-core'
import { validatePack, mergePacks } from '@petspark/spec-core'

describe('Generator Contract Tests', () => {
  it('should validate pack schema', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test Pack',
        version: '1.0.0',
      },
      dependencies: [],
      configuration: {},
    }

    expect(() => validatePack(pack)).not.toThrow()
  })

  it('should merge packs deterministically', () => {
    const pack1: Pack = {
      metadata: {
        packId: 'pack.1',
        name: 'Pack 1',
        version: '1.0.0',
      },
      configuration: {
        env: {
          VAR1: 'value1',
        },
        featureFlags: {
          flag1: true,
        },
      },
    }

    const pack2: Pack = {
      metadata: {
        packId: 'pack.2',
        name: 'Pack 2',
        version: '1.0.0',
      },
      configuration: {
        env: {
          VAR2: 'value2',
        },
        featureFlags: {
          flag2: false,
        },
      },
    }

    const merged = mergePacks([pack1, pack2])

    expect(merged.packs).toHaveLength(2)
    expect(merged.configuration.env).toEqual({
      VAR1: 'value1',
      VAR2: 'value2',
    })
    expect(merged.configuration.featureFlags).toEqual({
      flag1: true,
      flag2: false,
    })
  })

  it('should generate consistent hash for same pack', () => {
    const pack: Pack = {
      metadata: {
        packId: 'test.pack',
        name: 'Test Pack',
        version: '1.0.0',
      },
      configuration: {},
    }

    const merged1 = mergePacks([pack])
    const merged2 = mergePacks([pack])

    expect(merged1.metadata.hash).toBe(merged2.metadata.hash)
  })

  it('should snapshot PWA manifest structure', () => {
    const pack: Pack = {
      metadata: {
        packId: 'pwa.pack',
        name: 'PWA Pack',
        version: '1.0.0',
      },
      configuration: {
        outputs: {
          pwaManifest: {
            name: 'Test App',
            short_name: 'Test',
            start_url: '/',
            display: 'standalone',
          },
        },
      },
    }

    const merged = mergePacks([pack])

    expect(merged.configuration.outputs?.pwaManifest).toMatchSnapshot()
  })

  it('should snapshot Expo config structure', () => {
    const pack: Pack = {
      metadata: {
        packId: 'expo.pack',
        name: 'Expo Pack',
        version: '1.0.0',
      },
      configuration: {
        outputs: {
          expoConfig: {
            name: 'TestApp',
            slug: 'test-app',
            version: '1.0.0',
          },
        },
      },
    }

    const merged = mergePacks([pack])

    expect(merged.configuration.outputs?.expoConfig).toMatchSnapshot()
  })
})
