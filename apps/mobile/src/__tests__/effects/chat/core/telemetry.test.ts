/**
 * Unit Tests for Telemetry
 *
 * Location: apps/mobile/src/__tests__/effects/chat/core/telemetry.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearActiveEffects,
  getActiveEffectsCount,
  logEffectEnd,
  logEffectError,
  logEffectStart,
} from '../../../../effects/chat/core/telemetry'

describe('Telemetry', () => {
  beforeEach(() => {
    clearActiveEffects()
  })

  describe('logEffectStart', () => {
    it('should create effect ID', () => {
      const effectId = logEffectStart('send-warp')
      expect(effectId).toBeTruthy()
      expect(typeof effectId).toBe('string')
    })

    it('should track active effects', () => {
      logEffectStart('send-warp')
      expect(getActiveEffectsCount()).toBe(1)
    })
  })

  describe('logEffectEnd', () => {
    it('should end effect tracking', () => {
      const effectId = logEffectStart('send-warp')
      logEffectEnd(effectId, { durationMs: 220 })
      expect(getActiveEffectsCount()).toBe(0)
    })

    it('should warn on unknown effect ID', () => {
      // Should not throw
      logEffectEnd('unknown-id')
      expect(getActiveEffectsCount()).toBe(0)
    })
  })

  describe('logEffectError', () => {
    it('should track errors', () => {
      const effectId = logEffectStart('send-warp')
      const error = new Error('Test error')
      logEffectError(effectId, error)
      expect(getActiveEffectsCount()).toBe(0)
    })
  })

  describe('clearActiveEffects', () => {
    it('should clear all active effects', () => {
      logEffectStart('send-warp')
      logEffectStart('receive-air-cushion')
      expect(getActiveEffectsCount()).toBe(2)
      clearActiveEffects()
      expect(getActiveEffectsCount()).toBe(0)
    })
  })
})
