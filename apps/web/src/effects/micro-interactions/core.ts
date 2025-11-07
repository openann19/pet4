import { makeRng } from '@petspark/shared'
import type { ParticleOptions, RippleOptions } from './types'
import { isTruthy, isDefined } from '@/core/guards';

export class MicroInteractions {
  static createRipple(
    element: HTMLElement,
    event: MouseEvent | TouchEvent,
    options: RippleOptions = {}
  ): void {
    const {
      duration = 600,
      color = 'currentColor',
      opacity = 0.3
    } = options

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = 'touches' in event && event.touches[0]
      ? event.touches[0].clientX - rect.left
      : (event as MouseEvent).clientX - rect.left
    const y = 'touches' in event && event.touches[0]
      ? event.touches[0].clientY - rect.top
      : (event as MouseEvent).clientY - rect.top

    const ripple = document.createElement('span')
    ripple.style.position = 'absolute'
    ripple.style.borderRadius = '50%'
    ripple.style.backgroundColor = color
    ripple.style.opacity = opacity.toString()
    ripple.style.width = `${String(size ?? '')}px`
    ripple.style.height = `${String(size ?? '')}px`
    ripple.style.left = `${String(x - size / 2 ?? '')}px`
    ripple.style.top = `${String(y - size / 2 ?? '')}px`
    ripple.style.pointerEvents = 'none'
    ripple.style.transform = 'scale(0)'
    ripple.style.transition = `transform ${String(duration ?? '')}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${String(duration ?? '')}ms cubic-bezier(0.4, 0, 0.2, 1)`                        

    const container = element.querySelector('.ripple-container') || element
    if (!element.querySelector('.ripple-container')) {
      element.style.position = 'relative'
      element.style.overflow = 'hidden'
    }

    container.appendChild(ripple)

    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(2)'
      ripple.style.opacity = '0'
    })

    setTimeout(() => {
      ripple.remove()
    }, duration)
  }

  static animateSuccess(element: HTMLElement): void {
    const keyframes = [
      { transform: 'scale(1)', opacity: '1' },
      { transform: 'scale(1.1)', opacity: '0.8' },
      { transform: 'scale(1)', opacity: '1' }
    ]

    element.animate(keyframes, {
      duration: 300,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    })
  }

  static animateError(element: HTMLElement): void {
    const keyframes = [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ]

    element.animate(keyframes, {
      duration: 400,
      easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)'
    })
  }

  static animateCheckmark(element: HTMLElement): void {
    const svg = element.querySelector('svg') || element

    const path = svg.querySelector('path')
    if (isTruthy(path)) {
      const length = (path).getTotalLength()
      
      path.setAttribute('stroke-dasharray', length.toString())
      path.setAttribute('stroke-dashoffset', length.toString())

      const keyframes = [
        { strokeDashoffset: length.toString() },
        { strokeDashoffset: '0' }
      ]

      path.animate(keyframes, {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      })
    }
  }

  static pulseAttention(element: HTMLElement, count: number = 2): void {
    const keyframes = [
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(var(--primary), 0.7)' },
      { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(var(--primary), 0)' },                                                                            
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(var(--primary), 0)' }
    ]

    element.animate(keyframes, {
      duration: 800,
      iterations: count,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    })
  }

  static smoothScroll(
    element: HTMLElement,
    target: number,
    duration: number = 300
  ): void {
    const start = element.scrollTop
    const change = target - start
    const startTime = performance.now()

    const easeInOutQuad = (t: number): number => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutQuad(progress)

      element.scrollTop = start + change * eased

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  static countUp(
    element: HTMLElement,
    start: number,
    end: number,
    duration: number = 1000
  ): void {
    const startTime = performance.now()
    const range = end - start

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress

      const current = Math.round(start + range * eased)
      element.textContent = current.toLocaleString()

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    requestAnimationFrame(updateCount)
  }

  static morphShape(
    element: HTMLElement,
    fromRect: DOMRect,
    toRect: DOMRect,
    duration: number = 300
  ): void {
    const keyframes = [
      {
        left: `${String(fromRect.left ?? '')}px`,
        top: `${String(fromRect.top ?? '')}px`,
        width: `${String(fromRect.width ?? '')}px`,
        height: `${String(fromRect.height ?? '')}px`
      },
      {
        left: `${String(toRect.left ?? '')}px`,
        top: `${String(toRect.top ?? '')}px`,
        width: `${String(toRect.width ?? '')}px`,
        height: `${String(toRect.height ?? '')}px`
      }
    ]

    element.animate(keyframes, {
      duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    })
  }

  static createParticles(
    container: HTMLElement,
    count: number = 20,
    options: ParticleOptions = {}
  ): void {
    const {
      colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      size = 10,
      duration = 1000,
      spread = 200
    } = options

    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const seed = Date.now() + container.offsetLeft + container.offsetTop
    const rng = makeRng(seed)

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      particle.style.position = 'absolute'
      particle.style.width = `${String(size ?? '')}px`
      particle.style.height = `${String(size ?? '')}px`
      particle.style.borderRadius = '50%'
      const color = colors[Math.floor(rng() * colors.length)]
      if (isTruthy(color)) {
        particle.style.backgroundColor = color
      }
      particle.style.left = `${String(centerX ?? '')}px`
      particle.style.top = `${String(centerY ?? '')}px`
      particle.style.pointerEvents = 'none'

      container.appendChild(particle)

      const angle = (Math.PI * 2 * i) / count
      const velocity = spread * (0.5 + rng() * 0.5)
      const tx = Math.cos(angle) * velocity
      const ty = Math.sin(angle) * velocity

      const keyframes = [
        { transform: 'translate(0, 0) scale(1)', opacity: '1' },
        { transform: `translate(${String(tx ?? '')}px, ${String(ty ?? '')}px) scale(0)`, opacity: '0' }
      ]

      particle.animate(keyframes, {
        duration: duration + rng() * 500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      }).onfinish = () => { particle.remove(); }
    }
  }

  static shimmer(element: HTMLElement, duration: number = 2000): void {
    const shimmer = document.createElement('div')
    shimmer.style.position = 'absolute'
    shimmer.style.top = '0'
    shimmer.style.left = '-100%'
    shimmer.style.width = '100%'
    shimmer.style.height = '100%'
    shimmer.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'                                            
    shimmer.style.pointerEvents = 'none'

    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(shimmer)

    const keyframes = [
      { left: '-100%' },
      { left: '100%' }
    ]

    shimmer.animate(keyframes, {
      duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }).onfinish = () => { shimmer.remove(); }
  }

  static glow(
    element: HTMLElement,
    color: string = 'var(--primary)',
    duration: number = 2000
  ): void {
    const keyframes = [
      { boxShadow: `0 0 0 0 ${String(color ?? '')}` },
      { boxShadow: `0 0 20px 5px ${String(color ?? '')}` },
      { boxShadow: `0 0 0 0 ${String(color ?? '')}` }
    ]

    element.animate(keyframes, {
      duration,
      iterations: Infinity,
      easing: 'ease-in-out'
    })
  }
}

