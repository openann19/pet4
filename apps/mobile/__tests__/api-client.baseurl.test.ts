import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'

describe('resolveBaseUrl (production guard)', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('throws in production when no EXPO_PUBLIC_API_URL present', async () => {
    process.env['NODE_ENV'] = 'production'
    delete process.env['EXPO_PUBLIC_API_URL']
    // Dynamic import will reject if module throws during evaluation
    await expect(
      import('../src/utils/api-client')
    ).rejects.toThrow(/EXPO_PUBLIC_API_URL/i)
  })
})
