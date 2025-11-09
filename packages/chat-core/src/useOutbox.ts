import { useEffect, useRef, useCallback, useState } from 'react'

export interface OutboxItem {
  clientId: string
  payload: unknown
  attempt: number
  nextAt: number
  createdAt: number
  idempotencyKey?: string
}

export interface StorageFunctions {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

export interface UseOutboxOptions {
  sendFn: (payload: unknown) => Promise<void>
  storageKey?: string
  storage?: StorageFunctions
  baseRetryDelay?: number
  maxAttempts?: number
  maxDelay?: number
  jitter?: boolean
  onFlush?: () => void
}

export interface UseOutboxReturn {
  enqueue: (clientId: string, payload: unknown, idempotencyKey?: string) => void
  queue: OutboxItem[]
  clear: () => void
  flush: () => Promise<void>
  isOnline: boolean
}

/**
 * Generate a unique idempotency key using timestamp and random string
 * Note: Using Math.random() for idempotency keys is acceptable as they only need uniqueness,
 * not cryptographic security or determinism
 */
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

function calculateExponentialBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean
): number {
  const exponentialDelay = Math.min(2 ** attempt * baseDelay, maxDelay)
  if (jitter) {
    const jitterAmount = exponentialDelay * 0.1 * Math.random()
    return Math.floor(exponentialDelay + jitterAmount)
  }
  return exponentialDelay
}

export function useOutbox(options: UseOutboxOptions): UseOutboxReturn {
  const {
    sendFn,
    storageKey = 'chat-outbox',
    storage,
    baseRetryDelay = 250,
    maxAttempts = 7,
    maxDelay = 15_000,
    jitter = true,
    onFlush,
  } = options

  const [queue, setQueueState] = useState<OutboxItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const timerRef = useRef<number | null>(null)
  const sendFnRef = useRef(sendFn)
  const isProcessingRef = useRef(false)
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const storageRef = useRef(storage)
  const processQueueRef = useRef<(() => Promise<void>) | null>(null)
  const scheduleNextRef = useRef<(() => void) | null>(null)

  // Update storage ref when storage changes
  useEffect(() => {
    storageRef.current = storage
  }, [storage])

  // Load initial queue from storage
  useEffect(() => {
    let cancelled = false

    const loadQueue = async (): Promise<void> => {
      const currentStorage = storageRef.current
      if (!currentStorage || isLoaded) {
        if (!currentStorage) {
          setIsLoaded(true)
        }
        return
      }

      try {
        const stored = await currentStorage.getItem(storageKey)
        if (!cancelled && stored !== null) {
          try {
            const parsed = JSON.parse(stored) as OutboxItem[]
            if (Array.isArray(parsed)) {
              setQueueState(parsed)
            }
          } catch {
            // Invalid JSON, use empty array
          }
        }
      } catch {
        // Storage read failed, use empty array
      } finally {
        if (!cancelled) {
          setIsLoaded(true)
        }
      }
    }

    loadQueue().catch(() => {
      // Error handling is done in loadQueue
    })

    return () => {
      cancelled = true
    }
  }, [storageKey, isLoaded])

  // Save queue to storage when it changes
  useEffect(() => {
    const currentStorage = storageRef.current
    if (!currentStorage || !isLoaded) {
      return
    }

    const saveQueue = async (): Promise<void> => {
      try {
        await currentStorage.setItem(storageKey, JSON.stringify(queue))
      } catch {
        // Storage write failed, ignore
      }
    }

    saveQueue().catch(() => {
      // Error handling is done in saveQueue
    })
  }, [queue, storageKey, isLoaded])

  // Wrapper for setQueue that handles storage persistence
  const setQueue = useCallback(
    (updater: OutboxItem[] | ((prev: OutboxItem[]) => OutboxItem[])): void => {
      setQueueState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return next
      })
    },
    []
  )

  useEffect(() => {
    sendFnRef.current = sendFn
  }, [sendFn])

  const processQueue = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current || !isOnlineRef.current) {
      return
    }

    const currentQueue = queue
    if (currentQueue.length === 0) {
      return
    }

    isProcessingRef.current = true
    const now = Date.now()
    const ready: OutboxItem[] = currentQueue.filter((item: OutboxItem) => item.nextAt <= now)

    if (ready.length === 0) {
      isProcessingRef.current = false
      if (scheduleNextRef.current) scheduleNextRef.current()
      return
    }

    interface ProcessResult {
      success: boolean
      clientId: string
      failed?: boolean
      nextAttempt?: number
      delay?: number
    }

    const results: PromiseSettledResult<ProcessResult>[] = await Promise.allSettled(
      ready.map(async (item: OutboxItem): Promise<ProcessResult> => {
        try {
          await sendFnRef.current(item.payload)
          return { success: true, clientId: item.clientId }
        } catch {
          const nextAttempt = Math.min(item.attempt + 1, maxAttempts)
          if (nextAttempt >= maxAttempts) {
            return { success: false, clientId: item.clientId, failed: true }
          }
          const delay = calculateExponentialBackoff(nextAttempt, baseRetryDelay, maxDelay, jitter)
          return {
            success: false,
            clientId: item.clientId,
            nextAttempt,
            delay,
          }
        }
      })
    )

    setQueue((cur: OutboxItem[]) => {
      const current = cur
      return current
        .map((item: OutboxItem) => {
          const result = results.find(
            (r: PromiseSettledResult<ProcessResult>): r is PromiseFulfilledResult<ProcessResult> =>
              r.status === 'fulfilled' && r.value.clientId === item.clientId
          )

          if (!result) {
            return item
          }

          // Check if message was successfully sent or permanently failed

          if (result.value.success || result.value.failed) {
            return null
          }

          if (result.value.nextAttempt != null && result.value.delay != null) {
            return {
              ...item,
              attempt: result.value.nextAttempt,
              nextAt: Date.now() + result.value.delay,
            }
          }

          return item
        })
        .filter((item): item is OutboxItem => item != null)
    })

    isProcessingRef.current = false
    if (scheduleNextRef.current) scheduleNextRef.current()

    if (ready.length > 0 && onFlush !== undefined) {
      onFlush()
    }
  }, [queue, baseRetryDelay, maxAttempts, maxDelay, jitter, onFlush, setQueue])

  const scheduleNext = useCallback((): void => {
    if (timerRef.current !== null) {
      return
    }

    const currentQueue = queue
    if (currentQueue.length === 0) {
      return
    }

    const now = Date.now()
    const nextItem = currentQueue
      .filter((item: OutboxItem) => item.nextAt > now)
      .sort((a: OutboxItem, b: OutboxItem) => a.nextAt - b.nextAt)[0]

    const handleProcess = (): void => {
      timerRef.current = null
      const promise: Promise<void> | undefined = processQueueRef.current?.()
      promise?.catch(() => {
        // Error handling is done in processQueue
      })
    }

    if (nextItem !== undefined) {
      const delay = Math.max(nextItem.nextAt - now, 100)
      timerRef.current = window.setTimeout(handleProcess, delay) as unknown as number
    } else {
      timerRef.current = window.setTimeout(handleProcess, 300) as unknown as number
    }
  }, [queue])

  // Update refs after callbacks are created
  processQueueRef.current = processQueue
  scheduleNextRef.current = scheduleNext

  const enqueue = useCallback(
    (clientId: string, payload: unknown, idempotencyKey?: string): void => {
      const key = idempotencyKey ?? generateIdempotencyKey()

      setQueue((cur: OutboxItem[]) => {
        const current = cur

        const existingIndex = current.findIndex(
          (item: OutboxItem) => item.clientId === clientId || item.idempotencyKey === key
        )

        if (existingIndex >= 0) {
          return current.map((item: OutboxItem, index: number) =>
            index === existingIndex
              ? {
                  ...item,
                  payload,
                  attempt: 0,
                  nextAt: Date.now(),
                  idempotencyKey: key,
                }
              : item
          )
        }

        return [
          ...current,
          {
            clientId,
            payload,
            attempt: 0,
            nextAt: Date.now(),
            createdAt: Date.now(),
            idempotencyKey: key,
          },
        ]
      })

      if (isOnlineRef.current) {
        scheduleNext()
      }
    },
    [setQueue, scheduleNext]
  )

  const clear = useCallback((): void => {
    setQueue([])
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    isProcessingRef.current = false
  }, [setQueue])

  const flush = useCallback(async (): Promise<void> => {
    if (!isOnlineRef.current) {
      return
    }
    await processQueue()
  }, [processQueue])

  useEffect(() => {
    const handleOnline = (): void => {
      isOnlineRef.current = true
      const promise: Promise<void> = processQueue()
      promise.catch(() => {
        // Error handling is done in processQueue
      })
    }

    const handleOffline = (): void => {
      isOnlineRef.current = false
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      isOnlineRef.current = navigator.onLine

      if (isOnlineRef.current) {
        scheduleNext()
      }

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
        }
      }
    }

    return undefined
  }, [processQueue, scheduleNext])

  return {
    enqueue,
    queue,
    clear,
    flush,
    isOnline: isOnlineRef.current,
  }
}
