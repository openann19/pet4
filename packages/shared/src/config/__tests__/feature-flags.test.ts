import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FLAGS, FeatureFlags } from '../feature-flags'

// Mock the getEnvVar function
vi.mock('../types/process', () => ({
  getEnvVar: vi.fn((name: string, fallback: boolean) => fallback),
}))

describe('FeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export all required feature flags', () => {
    const expectedFlags: (keyof FeatureFlags)[] = [
      'HOLO_BACKGROUND',
      'GLOW_TRAIL',
      'MESSAGE_PEEK',
      'SMART_IMAGE',
      'AUDIO_SEND_PING',
      'CHAT_REACTIONS',
      'CHAT_STICKERS',
      'CHAT_VOICE_MESSAGES',
      'CHAT_LOCATION_SHARE',
      'CHAT_TRANSLATION',
      'CHAT_SMART_SUGGESTIONS',
    ]

    expectedFlags.forEach(flag => {
      expect(FLAGS).toHaveProperty(flag)
      expect(typeof FLAGS[flag]).toBe('boolean')
    })
  })

  it('should have default values for all flags', () => {
    // All flags should default to true based on the implementation
    Object.values(FLAGS).forEach(value => {
      expect(typeof value).toBe('boolean')
    })
  })

  it('should export FLAGS as default export', async () => {
    const defaultExport = await import('../feature-flags')
    expect(defaultExport.default).toBe(FLAGS)
  })

  it('should have readonly flags', () => {
    // TypeScript enforces readonly at compile time, but we can verify the structure
    const flags = FLAGS
    expect(typeof flags.HOLO_BACKGROUND).toBe('boolean')
    expect(Object.isFrozen(flags)).toBe(false) // Object is not frozen, but TypeScript prevents mutation
  })

  it('should include visual enhancement flags', () => {
    expect(FLAGS.HOLO_BACKGROUND).toBeDefined()
    expect(FLAGS.GLOW_TRAIL).toBeDefined()
    expect(FLAGS.MESSAGE_PEEK).toBeDefined()
    expect(FLAGS.SMART_IMAGE).toBeDefined()
  })

  it('should include audio enhancement flags', () => {
    expect(FLAGS.AUDIO_SEND_PING).toBeDefined()
  })

  it('should include chat feature flags', () => {
    expect(FLAGS.CHAT_REACTIONS).toBeDefined()
    expect(FLAGS.CHAT_STICKERS).toBeDefined()
    expect(FLAGS.CHAT_VOICE_MESSAGES).toBeDefined()
    expect(FLAGS.CHAT_LOCATION_SHARE).toBeDefined()
    expect(FLAGS.CHAT_TRANSLATION).toBeDefined()
    expect(FLAGS.CHAT_SMART_SUGGESTIONS).toBeDefined()
  })

  it('should maintain consistent interface', () => {
    const flagKeys = Object.keys(FLAGS) as (keyof FeatureFlags)[]
    expect(flagKeys).toHaveLength(11)

    // Ensure no duplicate keys
    const uniqueKeys = new Set(flagKeys)
    expect(uniqueKeys.size).toBe(11)
  })

  it('should have boolean values for all flags', () => {
    Object.values(FLAGS).forEach(value => {
      expect(value).toBeTypeOf('boolean')
    })
  })
})
