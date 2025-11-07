import { isTruthy, isDefined } from '@/core/guards';

export interface HapticFeedback {
  light: () => void
  medium: () => void
  heavy: () => void
  success: () => void
  warning: () => void
  error: () => void
}

export const haptics: HapticFeedback = {
  light: () => {
    if ('vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigator.vibrate(10)
    }
  },
  medium: () => {
    if ('vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigator.vibrate(20)
    }
  },
  heavy: () => {
    if ('vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigator.vibrate(30)
    }
  },
  success: () => {
    if ('vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigator.vibrate([10, 50, 10])
    }
  },
  warning: () => {
    if ('vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigator.vibrate([30, 50, 30])
    }
  },
  error: () => {
    if ('vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigator.vibrate([50, 100, 50])
    }
  }
}

export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const getAnimationDuration = (defaultMs: number): number => {
  return prefersReducedMotion() ? 0 : defaultMs
}

export interface DeviceCapabilities {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  supportsTouch: boolean
  supportsHaptics: boolean
  supportsGeolocation: boolean
  supportsNotifications: boolean
  supportsPushNotifications: boolean
  supportsServiceWorker: boolean
  isStandalone: boolean
  platform: string
  screenSize: { width: number; height: number }
  pixelRatio: number
}

export const detectDeviceCapabilities = (): DeviceCapabilities => {
  const width = window.innerWidth
  const height = window.innerHeight
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    supportsTouch: isTouchDevice,
    supportsHaptics: 'vibrate' in navigator,
    supportsGeolocation: 'geolocation' in navigator,
    supportsNotifications: 'Notification' in window,
    supportsPushNotifications: 'PushManager' in window,
    supportsServiceWorker: 'serviceWorker' in navigator,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    platform: navigator.platform,
    screenSize: { width, height },
    pixelRatio: window.devicePixelRatio || 1
  }
}

export const handleBackButton = (callback: () => boolean): (() => void) => {
  const handler = (e: PopStateEvent) => {
    e.preventDefault()
    const shouldPreventDefault = callback()
    if (!shouldPreventDefault) {
      window.history.back()
    }
  }
  
  window.addEventListener('popstate', handler)
  
  return () => { window.removeEventListener('popstate', handler); }
}

export const handleEscapeKey = (callback: () => void): (() => void) => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      callback()
    }
  }
  
  document.addEventListener('keydown', handler)
  
  return () => { document.removeEventListener('keydown', handler); }
}

export const preventBodyScroll = (prevent: boolean) => {
  if (isTruthy(prevent)) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
}

export const measureTextWidth = (text: string, font: string = '16px Inter'): number => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 0
  context.font = font
  return context.measureText(text).width
}

export const clampText = (text: string, maxWidth: number, font: string = '16px Inter'): string => {
  const width = measureTextWidth(text, font)
  if (width <= maxWidth) return text
  
  let clamped = text
  while (measureTextWidth(clamped + '...', font) > maxWidth && clamped.length > 0) {
    clamped = clamped.slice(0, -1)
  }
  return clamped + '...'
}

export interface SwipeGesture {
  deltaX: number
  deltaY: number
  direction: 'left' | 'right' | 'up' | 'down' | null
  velocity: number
}

export const detectSwipe = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startTime: number,
  endTime: number,
  threshold: number = 50
): SwipeGesture => {
  const deltaX = endX - startX
  const deltaY = endY - startY
  const duration = endTime - startTime
  const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / duration
  
  let direction: SwipeGesture['direction'] = null
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > threshold) {
      direction = deltaX > 0 ? 'right' : 'left'
    }
  } else {
    if (Math.abs(deltaY) > threshold) {
      direction = deltaY > 0 ? 'down' : 'up'
    }
  }
  
  return { deltaX, deltaY, direction, velocity }
}

export const requestIdleCallback = (callback: () => void, timeout: number = 2000): number => {
  if ('requestIdleCallback' in window && window.requestIdleCallback) {
    return window.requestIdleCallback(callback, { timeout })
  }
  return window.setTimeout(callback, 0)
}

export const cancelIdleCallback = (id: number) => {
  if ('cancelIdleCallback' in window && window.cancelIdleCallback) {
    window.cancelIdleCallback(id)
  } else {
    window.clearTimeout(id)
  }
}
