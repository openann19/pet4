import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from './logger'

const logger = createLogger('OptimizationCore')

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) callback(entry)
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [callback, options])

  return ref
}

export function useThrottle<T>(value: T, limit: number = 100): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(((...args) => {
    return callbackRef.current(...args)
  }) as T, [])
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    return effect()
  }, deps)
}

export function useMountedState(): () => boolean {
  const mountedRef = useRef(false)
  const isMounted = useCallback(() => mountedRef.current, [])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  return isMounted
}

export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps?: React.DependencyList
) {
  const isMounted = useMountedState()

  useEffect(() => {
    let cleanup: void | (() => void)

    effect().then((cleanupFn) => {
      if (isMounted()) {
        cleanup = cleanupFn
      }
    })

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, deps)
}

export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

export function createMemoizedSelector<T, R>(
  selector: (data: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
): (data: T) => R {
  let lastInput: T | undefined
  let lastResult: R | undefined

  return (data: T): R => {
    if (lastInput === undefined || lastResult === undefined || data !== lastInput) {
      const newResult = selector(data)
      
      if (lastResult === undefined || !equalityFn(newResult, lastResult)) {
        lastResult = newResult
      }
      
      lastInput = data
    }

    return lastResult
  }
}

export function batchSync<T>(
  callback: (items: T[]) => void,
  options: { maxWait?: number; maxSize?: number } = {}
): (item: T) => void {
  const { maxWait = 50, maxSize = 20 } = options
  let queue: T[] = []
  let timeoutId: number | null = null

  const flush = () => {
    if (queue.length === 0) return

    const itemsToProcess = [...queue]
    queue = []

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    callback(itemsToProcess)
  }

  return (item: T) => {
    queue.push(item)

    if (queue.length >= maxSize) {
      flush()
      return
    }

    if (timeoutId === null) {
      timeoutId = window.setTimeout(flush, maxWait) as unknown as number
    }
  }
}

export function createRAFScheduler() {
  let rafId: number | null = null
  let callbacks: Array<() => void> = []

  const flush = () => {
    const currentCallbacks = callbacks
    callbacks = []
    rafId = null

    currentCallbacks.forEach((cb) => {
      try {
        cb()
      } catch (error) {
        logger.error('RAF callback error', error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  return {
    schedule: (callback: () => void) => {
      callbacks.push(callback)

      if (rafId === null) {
        rafId = requestAnimationFrame(flush)
      }
    },
    cancel: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      callbacks = []
    },
  }
}

export const rafScheduler = createRAFScheduler()

export function useRAF(callback: () => void, enabled: boolean = true) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let rafId: number

    const tick = () => {
      callbackRef.current()
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [enabled])
}

export function shallowEqual<T extends Record<string, any>>(objA: T, objB: T): boolean {
  if (objA === objB) return true

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false
    }
  }

  return true
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (a == null || b == null) return a === b

  if (typeof a !== typeof b) return false

  if (typeof a !== 'object') return a === b

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null && !Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false
    }
  }

  return true
}

export function useShallowMemo<T extends Record<string, any>>(value: T): T {
  const ref = useRef<T>(value)

  if (!shallowEqual(ref.current, value)) {
    ref.current = value
  }

  return ref.current
}

export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value)

  if (!deepEqual(ref.current, value)) {
    ref.current = value
  }

  return ref.current
}
