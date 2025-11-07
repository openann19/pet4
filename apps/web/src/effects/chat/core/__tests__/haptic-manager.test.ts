import { describe, expect, it } from 'vitest'
import { HapticManager } from '../haptic-manager'

describe('Haptic Manager', () => {
  describe('cooldown', () => {
    it('should prevent rapid triggers', () => {
      const h = new HapticManager(500)
      // force allow by disabling reduced motion
      h.updateReducedMotion(false)
      const a = h.trigger('light')
      const b = h.trigger('light')
      expect(a).toBe(true)
      expect(b).toBe(false)
    })
  })
})

