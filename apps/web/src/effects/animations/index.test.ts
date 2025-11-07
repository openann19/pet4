import { describe, it, expect } from 'vitest'
import {
  springTransition,
  smoothTransition,
  elasticTransition,
  butterySmoothTransition,
  smoothPageTransition
} from '../animations/transitions'
import {
  fadeInUp,
  fadeInScale,
  slideInFromRight,
  slideInFromLeft,
  elasticPop
} from '../animations/variants'
import {
  hoverLift,
  hoverGrow,
  tapShrink,
  cardHover,
  buttonHover
} from '../animations/interactions'
import {
  glowPulse,
  shimmerEffect,
  floatAnimation,
  pulseScale
} from '../animations/loops'

describe('Animations', () => {
  describe('Transitions', () => {
    it('should export all transitions', () => {
      expect(springTransition).toBeDefined()
      expect(smoothTransition).toBeDefined()
      expect(elasticTransition).toBeDefined()
      expect(butterySmoothTransition).toBeDefined()
      expect(smoothPageTransition).toBeDefined()
    })

    it('should have correct spring transition structure', () => {
      expect(springTransition).toHaveProperty('type', 'spring')
      expect(springTransition).toHaveProperty('stiffness')
      expect(springTransition).toHaveProperty('damping')
    })

    it('should have correct smooth transition structure', () => {
      expect(smoothTransition).toHaveProperty('duration')
      expect(smoothTransition).toHaveProperty('ease')
    })
  })

  describe('Variants', () => {
    it('should export all variants', () => {
      expect(fadeInUp).toBeDefined()
      expect(fadeInScale).toBeDefined()
      expect(slideInFromRight).toBeDefined()
      expect(slideInFromLeft).toBeDefined()
      expect(elasticPop).toBeDefined()
    })

    it('should have correct variant structure', () => {
      expect(fadeInUp).toHaveProperty('initial')
      expect(fadeInUp).toHaveProperty('animate')
      expect(fadeInUp).toHaveProperty('exit')
    })
  })

  describe('Interactions', () => {
    it('should export all interaction animations', () => {
      expect(hoverLift).toBeDefined()
      expect(hoverGrow).toBeDefined()
      expect(tapShrink).toBeDefined()
      expect(cardHover).toBeDefined()
      expect(buttonHover).toBeDefined()
    })

    it('should have correct interaction structure', () => {
      expect(hoverLift).toHaveProperty('scale')
      expect(hoverLift).toHaveProperty('transition')
    })
  })

  describe('Loops', () => {
    it('should export all loop animations', () => {
      expect(glowPulse).toBeDefined()
      expect(shimmerEffect).toBeDefined()
      expect(floatAnimation).toBeDefined()
      expect(pulseScale).toBeDefined()
    })

    it('should have correct loop structure', () => {
      expect(glowPulse).toHaveProperty('transition')
      expect(glowPulse.transition).toHaveProperty('repeat', Infinity)
    })
  })
})

