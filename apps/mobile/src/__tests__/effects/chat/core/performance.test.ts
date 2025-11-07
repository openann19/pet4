/**
 * Unit Tests for Performance Monitoring
 * 
 * Location: apps/mobile/src/__tests__/effects/chat/core/performance.test.ts
 */

import { describe, expect, it } from 'vitest'
import {
  detectDeviceHz,
  exceedsFrameBudget,
  getFrameBudget,
} from '../../../../effects/chat/core/performance'

describe('Performance Monitoring', () => {
  describe('getFrameBudget', () => {
    it('should return correct frame budget for 60Hz', () => {
      const budget = getFrameBudget(60)
      expect(budget).toBeCloseTo(16.67, 1)
    })

    it('should return correct frame budget for 120Hz', () => {
      const budget = getFrameBudget(120)
      expect(budget).toBeCloseTo(8.33, 1)
    })
  })

  describe('detectDeviceHz', () => {
    it('should return a valid DeviceHz value', () => {
      const hz = detectDeviceHz()
      expect([60, 120]).toContain(hz)
    })
  })

  describe('exceedsFrameBudget', () => {
    it('should return true when duration exceeds budget', () => {
      expect(exceedsFrameBudget(20, 60)).toBe(true)
    })

    it('should return false when duration is within budget', () => {
      expect(exceedsFrameBudget(10, 60)).toBe(false)
    })
  })
})

