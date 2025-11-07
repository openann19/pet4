/**
 * Mobile-compatible useOutbox hook
 * Uses React Native NetInfo instead of window events
 */

import { useEffect, useRef } from 'react'
import { useStorage } from '@/hooks/useStorage'
import NetInfo from '@react-native-community/netinfo'
import type { AppStateStatus } from 'react-native'
import { AppState } from 'react-native'
import { isTruthy, isDefined } from '@/core/guards';

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendFnRef = useRef(sendFn)
  const isOnlineRef = useRef<boolean>(true)

  useEffect(() => {
    sendFnRef.current = sendFn
  }, [sendFn])

  const schedule = (): void => {
    if (timerRef.current != null) return

    timerRef.current = setTimeout(async function tick() {
      timerRef.current = null

      if (!isOnlineRef.current) {
        schedule()
        return
      }

      const now = Date.now()
      const ready = (queue || []).filter((q: OutboxItem) => q.nextAt <= now)

      for (const item of ready) {
        try {
          await sendFnRef.current(item.payload)
          setQueue((cur: OutboxItem[] | undefined) =>
            (cur || []).filter((x: OutboxItem) => x.clientId !== item.clientId)
          )
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
    }, 300)
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
    const unsubscribe = NetInfo.addEventListener((state) => {
      isOnlineRef.current = state.isConnected ?? false
      if (isTruthy(state.isConnected)) {
        schedule()
      }
    })

    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      if (nextAppState === 'active') {
        schedule()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    schedule()

    return () => {
      unsubscribe()
      subscription.remove()
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [queue])

  return { enqueue, queue: queue || [], clear }
}
