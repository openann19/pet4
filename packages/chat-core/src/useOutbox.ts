import { useEffect, useRef } from 'react'
import { useStorage } from '@/hooks/useStorage'

export interface OutboxItem {
  clientId: string
  payload: unknown
  attempt: number
  nextAt: number
}

export interface UseOutboxOptions {
  sendFn: (payload: unknown) => Promise<void>
  storageKey?: string
  retryDelay?: number
  maxAttempts?: number
  maxDelay?: number
}

export interface UseOutboxReturn {
  enqueue: (clientId: string, payload: unknown) => void
  queue: OutboxItem[]
  clear: () => void
}

export function useOutbox(options: UseOutboxOptions): UseOutboxReturn {
  const {
    sendFn,
    storageKey = 'chat-outbox',
    retryDelay = 250,
    maxAttempts = 7,
    maxDelay = 15_000,
  } = options

  const [queue, setQueue] = useStorage<OutboxItem[]>(storageKey, [])
  const timer = useRef<number | null>(null)
  const sendFnRef = useRef(sendFn)

  useEffect(() => {
    sendFnRef.current = sendFn
  }, [sendFn])

  const schedule = (): void => {
    if (timer.current != null) return

    timer.current = window.setTimeout(async function tick() {
      timer.current = null
      const now = Date.now()
      const ready = (queue || []).filter((q: OutboxItem) => q.nextAt <= now)

      for (const item of ready) {
        try {
          await sendFnRef.current(item.payload)
          setQueue((cur: OutboxItem[] | undefined) => (cur || []).filter((x: OutboxItem) => x.clientId !== item.clientId))
        } catch {
          const nextAttempt = Math.min(item.attempt + 1, maxAttempts)
          const delay = Math.min(2 ** nextAttempt * retryDelay, maxDelay)
          setQueue((cur: OutboxItem[] | undefined) =>
            (cur || []).map((x: OutboxItem) =>
              x.clientId === item.clientId
                ? { ...x, attempt: nextAttempt, nextAt: Date.now() + delay }
                : x
            )
          )
        }
      }

      schedule()
    }, 300) as unknown as number
  }

  const enqueue = (clientId: string, payload: unknown): void => {
    setQueue((cur: OutboxItem[] | undefined) => [
      ...(cur || []),
      { clientId, payload, attempt: 0, nextAt: Date.now() },
    ])
    schedule()
  }

  const clear = (): void => {
    setQueue([])
  }

  useEffect(() => {
    const onOnline = (): void => schedule()
    window.addEventListener('online', onOnline)
    schedule()
    return () => {
      window.removeEventListener('online', onOnline)
      if (timer.current != null) window.clearTimeout(timer.current)
    }
  }, [queue])

  return { enqueue, queue: queue || [], clear }
}

