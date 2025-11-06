/**
 * Unit Tests for Haptic Manager
 * 
 * Location: apps/mobile/src/__tests__/effects/chat/core/haptic-manager.test.ts
 */

import * as Haptics from 'expo-haptics'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHapticManager, triggerHaptic } from '../../../../effects/chat/core/haptic-manager'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 0,
    Medium: 1,
    Heavy: 2,
  },
  NotificationFeedbackType: {
    Success: 0,
    Warning: 1,
    Error: 2,
  },
}))

// Mock performance.now() for consistent timing
const mockPerformanceNow = vi.fn(() => 1000)
vi.stubGlobal('performance', {
  now: mockPerformanceNow,
})

describe('Haptic Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(1000)
    const manager = getHapticManager()
    manager.resetCooldown()
    manager.updateReducedMotion(false)
  })

  describe('trigger', () => {
    it('should trigger light haptic', () => {
      triggerHaptic('light')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })

    it('should trigger medium haptic', () => {
      triggerHaptic('medium')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
    })

    it('should trigger success haptic', () => {
      triggerHaptic('success')
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success)
    })

    it('should trigger selection haptic', () => {
      triggerHaptic('selection')
      expect(Haptics.selectionAsync).toHaveBeenCalled()
    })

    it('should respect cooldown', () => {
      triggerHaptic('light')
      vi.clearAllMocks()
      mockPerformanceNow.mockReturnValue(1200) // 200ms later, still in cooldown
      triggerHaptic('light')
      // Should not trigger again due to cooldown
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('should bypass cooldown when requested', () => {
      triggerHaptic('light', true)
      mockPerformanceNow.mockReturnValue(1100)
      triggerHaptic('light', true)
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(2)
    })

    it('should not trigger when reduced motion is enabled', () => {
      const manager = getHapticManager()
      manager.updateReducedMotion(true)
      triggerHaptic('light')
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })
  })

  describe('isCooldownActive', () => {
    it('should return true immediately after trigger', () => {
      const manager = getHapticManager()
      triggerHaptic('light')
      expect(manager.isCooldownActive()).toBe(true)
    })

    it('should return false after cooldown period', () => {
      const manager = getHapticManager()
      triggerHaptic('light')
      mockPerformanceNow.mockReturnValue(2000) // 1000ms later, past cooldown
      expect(manager.isCooldownActive()).toBe(false)
    })
  })
})
