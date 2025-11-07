import { useEffect, useRef, useCallback } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { isTruthy, isDefined } from '@/core/guards';

export interface OutboxItem {
  clientId: string
  payload: unknown
  attempt: number
  nextAt: number
  createdAt: number
  idempotencyKey?: string
}

export interface UseOutboxOptions {
  sendFn: (payload: unknown) => Promise<void>
  storageKey?: string
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

function generateIdempotencyKey(): string {
  return `${String(Date.now() ?? '')}-${String(Math.random().toString(36).substring(2, 15) ?? '')}`
}

function calculateExponentialBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean
): number {
  const exponentialDelay = Math.min(2 ** attempt * baseDelay, maxDelay)
  if (isTruthy(jitter)) {
    const jitterAmount = exponentialDelay * 0.1 * Math.random()
    return Math.floor(exponentialDelay + jitterAmount)
  }
  return exponentialDelay
}

export function useOutbox(options: UseOutboxOptions): UseOutboxReturn {
  const {
    sendFn,
    storageKey = 'chat-outbox',
    baseRetryDelay = 250,
    maxAttempts = 7,
    maxDelay = 15_000,
    jitter = true,
    onFlush,
  } = options

  const [queue, setQueue] = useStorage<OutboxItem[]>(storageKey, [])
  const timerRef = useRef<number | null>(null)
  const sendFnRef = useRef(sendFn)
  const isProcessingRef = useRef(false)
  const isOnlineRef = useRef(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    sendFnRef.current = sendFn
  }, [sendFn])

  const processQueue = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current || !isOnlineRef.current) {
      return
    }

    const currentQueue = queue || []
    if (currentQueue.length === 0) {
      return
    }

    isProcessingRef.current = true
    const now = Date.now()
    const ready = currentQueue.filter((item: OutboxItem) => item.nextAt <= now)

    if (ready.length === 0) {
      isProcessingRef.current = false
      scheduleNext()
      return
    }

    interface ProcessResult {
      success: boolean
      clientId: string
      failed?: boolean
      nextAttempt?: number
      delay?: number
    }

    const results = await Promise.allSettled(
      ready.map(async (item: OutboxItem): Promise<ProcessResult> => {
        try {
          await sendFnRef.current(item.payload)
          return { success: true, clientId: item.clientId }
        } catch {
          const nextAttempt = Math.min(item.attempt + 1, maxAttempts)
          if (nextAttempt >= maxAttempts) {
            return { success: false, clientId: item.clientId, failed: true }
          }
          const delay = calculateExponentialBackoff(
            nextAttempt,
            baseRetryDelay,
            maxDelay,
            jitter
          )
          return {
            success: false,
            clientId: item.clientId,
            nextAttempt,
            delay,
          }
        }
      })
    )

    setQueue((cur: OutboxItem[] | undefined) => {
      const current = cur || []
      return current
        .map((item: OutboxItem) => {
          const result = results.find(
            (r): r is PromiseFulfilledResult<ProcessResult> =>
              r.status === 'fulfilled' &&
              r.value.clientId === item.clientId
          )

          if (!result) {
            return item
          }

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
    scheduleNext()

    if (ready.length > 0 && onFlush) {
      onFlush()
    }
  }, [queue, baseRetryDelay, maxAttempts, maxDelay, jitter, onFlush])

  const scheduleNext = useCallback((): void => {
    if (timerRef.current != null) {
      return
    }

    const currentQueue = queue || []
    if (currentQueue.length === 0) {
      return
    }

    const now = Date.now()
    const nextItem = currentQueue
      .filter((item: OutboxItem) => item.nextAt > now)
      .sort((a: OutboxItem, b: OutboxItem) => a.nextAt - b.nextAt)[0]

    if (isTruthy(nextItem)) {
      const delay = Math.max(nextItem.nextAt - now, 100)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        void processQueue()
      }, delay) as unknown as number
    } else {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        void processQueue()
      }, 300) as unknown as number
    }
  }, [queue, processQueue])

  const enqueue = useCallback(
    (
      clientId: string,
      payload: unknown,
      idempotencyKey?: string
    ): void => {
      const key = idempotencyKey ?? generateIdempotencyKey()

      setQueue((cur: OutboxItem[] | undefined) => {
        const current = cur || []

        const existingIndex = current.findIndex(
          (item: OutboxItem) =>
            item.clientId === clientId ||
            item.idempotencyKey === key
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

      if (isTruthy(isOnlineRef.current)) {
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
      void processQueue()
    }

    const handleOffline = (): void => {
      isOnlineRef.current = false
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      isOnlineRef.current = navigator.onLine

      if (isTruthy(isOnlineRef.current)) {
        scheduleNext()
      }

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        if (timerRef.current != null) {
          window.clearTimeout(timerRef.current)
        }
      }
    }

    return undefined
  }, [processQueue, scheduleNext])

  return {
    enqueue,
    queue: queue || [],
    clear,
    flush,
    isOnline: isOnlineRef.current,
  }
}

