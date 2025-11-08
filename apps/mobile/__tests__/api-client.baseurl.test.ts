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

  it('throws in production when no EXPO_PUBLIC_API_URL present', () => {
    process.env['NODE_ENV'] = 'production'
    delete process.env['EXPO_PUBLIC_API_URL']
    expect(() => {
      // re-import to run resolveBaseUrl
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../src/utils/api-client')
    }).toThrow(/EXPO_PUBLIC_API_URL/i)
  })
})
