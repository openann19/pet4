import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MicroInteractions } from '../micro-interactions/core'

describe('MicroInteractions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('createRipple', () => {
    it('should create a ripple effect on element', () => {
      const element = document.createElement('div')
      element.style.width = '100px'
      element.style.height = '100px'
      document.body.appendChild(element)

      const event = new MouseEvent('click', {
        clientX: 50,
        clientY: 50
      })

      MicroInteractions.createRipple(element, event)

      const ripple = element.querySelector('span')
      expect(ripple).toBeTruthy()
      expect(ripple?.style.position).toBe('absolute')
    })

    it('should accept custom options', () => {
      const element = document.createElement('div')
      element.style.width = '100px'
      element.style.height = '100px'
      document.body.appendChild(element)

      const event = new MouseEvent('click', {
        clientX: 50,
        clientY: 50
      })

      MicroInteractions.createRipple(element, event, {
        color: '#ff0000',
        opacity: 0.5,
        duration: 1000
      })

      const ripple = element.querySelector('span')
      expect(ripple?.style.backgroundColor).toBe('rgb(255, 0, 0)')
      expect(ripple?.style.opacity).toBe('0.5')
    })
  })

  describe('animateSuccess', () => {
    it('should animate element with success animation', () => {
      const element = document.createElement('div')
      document.body.appendChild(element)

      const animateSpy = vi.spyOn(element, 'animate')
      MicroInteractions.animateSuccess(element)

      expect(animateSpy).toHaveBeenCalled()
      const call = animateSpy.mock.calls[0]
      expect(call?.[0]).toHaveLength(3)
      const options = call?.[1] as KeyframeAnimationOptions
      expect(options?.duration).toBe(300)
    })
  })

  describe('animateError', () => {
    it('should animate element with error animation', () => {
      const element = document.createElement('div')
      document.body.appendChild(element)

      const animateSpy = vi.spyOn(element, 'animate')
      MicroInteractions.animateError(element)

      expect(animateSpy).toHaveBeenCalled()
      const call = animateSpy.mock.calls[0]
      expect(call?.[0]).toHaveLength(6)
    })
  })

  describe('countUp', () => {
    it('should update element text content', () => {
      const element = document.createElement('div')
      document.body.appendChild(element)

      vi.useFakeTimers()
      MicroInteractions.countUp(element, 0, 100, 1000)

      vi.advanceTimersByTime(500)
      expect(element.textContent).not.toBe('100')

      vi.advanceTimersByTime(600)
      expect(element.textContent).toBe('100')

      vi.useRealTimers()
    })
  })

  describe('createParticles', () => {
    it('should create particles in container', () => {
      const container = document.createElement('div')
      container.style.width = '200px'
      container.style.height = '200px'
      document.body.appendChild(container)

      MicroInteractions.createParticles(container, 5)

      const particles = container.querySelectorAll('div')
      expect(particles.length).toBe(5)
    })

    it('should accept custom options', () => {
      const container = document.createElement('div')
      container.style.width = '200px'
      container.style.height = '200px'
      document.body.appendChild(container)

      MicroInteractions.createParticles(container, 3, {
        colors: ['#ff0000'],
        size: 20
      })

      const particles = container.querySelectorAll('div')
      expect(particles.length).toBe(3)
    })
  })

  describe('shimmer', () => {
    it('should create shimmer effect', () => {
      const element = document.createElement('div')
      document.body.appendChild(element)

      MicroInteractions.shimmer(element)

      const shimmer = element.querySelector('div')
      expect(shimmer).toBeTruthy()
      expect(shimmer?.style.position).toBe('absolute')
    })
  })

  describe('glow', () => {
    it('should create glow animation', () => {
      const element = document.createElement('div')
      document.body.appendChild(element)

      const animateSpy = vi.spyOn(element, 'animate')
      MicroInteractions.glow(element, '#ff0000', 1000)

      expect(animateSpy).toHaveBeenCalled()
      const call = animateSpy.mock.calls[0]
      const options = call?.[1] as KeyframeAnimationOptions
      expect(options?.iterations).toBe(Infinity)
    })
  })
})

