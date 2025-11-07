/**
 * Unit Tests for Chat Effects Core Utilities
 * 
 * Tests for reduced motion, haptics, performance, and telemetry
 * 
 * Location: apps/mobile/src/__tests__/effects/chat/core/reduced-motion.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isReduceMotionEnabled } from '../../../../effects/chat/core/reduced-motion'

// Mock react-native with lazy import pattern
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return {
    ...actual,
    AccessibilityInfo: {
      isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
    Platform: {
      OS: 'ios',
    },
  }
})

describe('Reduced Motion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isReduceMotionEnabled', () => {
    it('should return false when window is undefined (SSR)', () => {
      // @ts-expect-error - test mock
      global.window = undefined
      expect(isReduceMotionEnabled()).toBe(false)
    })

    it('should return false when matchMedia is not available', () => {
      // @ts-expect-error - test mock
      global.window = { matchMedia: undefined }
      expect(isReduceMotionEnabled()).toBe(false)
    })

    it('should return false on error', () => {
      // @ts-expect-error - test mock
      global.window = {
        matchMedia: () => {
          throw new Error('Test error')
        }
      }
      expect(isReduceMotionEnabled()).toBe(false)
    })
  })
})
