import { useEffect, useRef, useState, useCallback } from 'react'
import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('advanced-features')

// Browser API type extensions
interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

interface NetworkInformation extends EventTarget {
  type: string
  effectiveType: string
}

interface WakeLockManager {
  request(type: 'screen'): Promise<WakeLockSentinel>
}

interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>
  released: boolean
  type: 'screen'
}

interface NavigatorWithBattery {
  getBattery?(): Promise<BatteryManager>
  connection?: NetworkInformation
  wakeLock?: WakeLockManager
}

interface WindowWithNavigator {
  navigator: Navigator & NavigatorWithBattery
}

export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (isTruthy(entry.isIntersecting)) {
            callback()
          }
        })
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(target)
    return () => { observer.disconnect(); }
  }, [callback, options])

  return targetRef
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => { setMatches(e.matches); }
    media.addEventListener('change', listener)
    return () => { media.removeEventListener('change', listener); }
  }, [query])

  return matches
}

export function useLongPress(
  callback: () => void,
  options: { delay?: number; onStart?: () => void; onCancel?: () => void } = {}
) {
  const { delay = 500, onStart, onCancel } = options
  const timeoutRef = useRef<number | undefined>(undefined)
  const [isPressed, setIsPressed] = useState(false)

  const start = useCallback(() => {
    setIsPressed(true)
    onStart?.()
    timeoutRef.current = window.setTimeout(() => {
      callback()
      setIsPressed(false)
    }, delay)
  }, [callback, delay, onStart])

  const cancel = useCallback(() => {
    if (isTruthy(timeoutRef.current)) {
      clearTimeout(timeoutRef.current)
      setIsPressed(false)
      onCancel?.()
    }
  }, [onCancel])

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  }

  return { handlers, isPressed }
}

export function useIdleDetection(
  callback: () => void,
  timeout: number = 60000
) {
  const timeoutRef = useRef<number | undefined>(undefined)

  const resetTimer = useCallback(() => {
    if (isTruthy(timeoutRef.current)) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(callback, timeout)
  }, [callback, timeout])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
      if (isTruthy(timeoutRef.current)) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [resetTimer])
}

export function usePageVisibility(
  onVisible?: () => void,
  onHidden?: () => void
) {
  const [isVisible, setIsVisible] = useState(!document.hidden)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsVisible(visible)
      
      if (isTruthy(visible)) {
        onVisible?.()
      } else {
        onHidden?.()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onVisible, onHidden])

  return isVisible
}

export function useBatteryStatus() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState<boolean | null>(null)

  useEffect(() => {
    const nav = (window as unknown as WindowWithNavigator).navigator
    if (isTruthy(nav.getBattery)) {
      nav.getBattery().then((battery: BatteryManager) => {
        setBatteryLevel(battery.level)
        setIsCharging(battery.charging)

        const updateLevel = () => { setBatteryLevel(battery.level); }
        const updateCharging = () => { setIsCharging(battery.charging); }

        battery.addEventListener('levelchange', updateLevel)
        battery.addEventListener('chargingchange', updateCharging)

        return () => {
          battery.removeEventListener('levelchange', updateLevel)
          battery.removeEventListener('chargingchange', updateCharging)
        }
      }).catch((error) => {
        logger.error('Failed to get battery status', error instanceof Error ? error : new Error(String(error)))
      })
    }
  }, [])

  return { batteryLevel, isCharging }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [effectiveType, setEffectiveType] = useState<string>('unknown')

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); }
    const handleOffline = () => { setIsOnline(false); }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const nav = (window as unknown as WindowWithNavigator).navigator
    if (isTruthy(nav.connection)) {
      const connection = nav.connection
      setConnectionType(connection.type || 'unknown')
      setEffectiveType(connection.effectiveType || 'unknown')

      const handleChange = () => {
        setConnectionType(connection.type || 'unknown')
        setEffectiveType(connection.effectiveType || 'unknown')
      }

      connection.addEventListener('change', handleChange)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, connectionType, effectiveType }
}

export function useGeolocation(options?: PositionOptions) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError({
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
      setLoading(false)
      return
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition(pos)
      setError(null)
      setLoading(false)
    }

    const onError = (err: GeolocationPositionError) => {
      setError(err)
      setLoading(false)
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  }, [])

  return { position, error, loading }
}

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => { setCopied(false); }, 2000)
      return true
    } catch (err) {
      logger.error('Failed to copy', err instanceof Error ? err : new Error(String(err)))
      return false
    }
  }, [])

  return { copy, copied }
}

export function useShare() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('share' in navigator)
  }, [])

  const share = useCallback(async (data: ShareData) => {
    if (!isSupported) return false

    try {
      await navigator.share(data)
      return true
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        logger.error('Share failed', err instanceof Error ? err : new Error(String(err)))
      }
      return false
    }
  }, [isSupported])

  return { share, isSupported }
}

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = useCallback(async () => {
    const nav = (window as unknown as WindowWithNavigator).navigator
    if (isTruthy(nav.wakeLock)) {
      try {
        wakeLockRef.current = await nav.wakeLock.request('screen')
        setIsLocked(true)

        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false)
        })
      } catch (err) {
        logger.error('Wake Lock request failed', err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (isTruthy(wakeLockRef.current)) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
      setIsLocked(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (isTruthy(wakeLockRef.current)) {
        wakeLockRef.current.release()
      }
    }
  }, [])

  return { isLocked, requestWakeLock, releaseWakeLock }
}

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => { mediaQuery.removeEventListener('change', handleChange); }
  }, [])

  return prefersReducedMotion
}

export function usePrefersColorScheme() {
  const [prefersDark, setPrefersDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => { mediaQuery.removeEventListener('change', handleChange); }
  }, [])

  return prefersDark ? 'dark' : 'light'
}

export function useOrientation() {
  const [orientation, setOrientation] = useState(
    window.screen?.orientation?.type || 'unknown'
  )

  useEffect(() => {
    const handleChange = () => {
      setOrientation(window.screen?.orientation?.type || 'unknown')
    }

    window.screen?.orientation?.addEventListener('change', handleChange)
    return () => {
      window.screen?.orientation?.removeEventListener('change', handleChange)
    }
  }, [])

  return orientation
}
