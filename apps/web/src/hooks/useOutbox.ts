/**
 * useOutbox Hook - React Query Version
 *
 * Offline message queue with:
 * - Exponential backoff with jitter
 * - Idempotent clientId
 * - Auto-flush on reconnect
 * - React Query persistence (IndexedDB)
 *
 * Location: apps/web/src/hooks/useOutbox.ts
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { idbStorage } from '@/lib/storage-adapter';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useOutbox');

export interface OutboxItem {
  clientId: string;
  payload: unknown;
  attempt: number;
  nextAt: number;
  createdAt: number;
  idempotencyKey?: string;
}

export interface UseOutboxOptions {
  sendFn: (payload: unknown) => Promise<void>;
  storageKey?: string;
  baseRetryDelay?: number;
  maxAttempts?: number;
  maxDelay?: number;
  jitter?: boolean;
  onFlush?: () => void;
}

export interface UseOutboxReturn {
  enqueue: (clientId: string, payload: unknown, idempotencyKey?: string) => void;
  queue: OutboxItem[];
  clear: () => void;
  flush: () => Promise<void>;
  isOnline: boolean;
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function calculateExponentialBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean
): number {
  const exponentialDelay = Math.min(2 ** attempt * baseDelay, maxDelay);
  if (jitter) {
    const jitterAmount = exponentialDelay * 0.1 * Math.random();
    return Math.floor(exponentialDelay + jitterAmount);
  }
  return exponentialDelay;
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
  } = options;

  const queryClient = useQueryClient();
  const timerRef = useRef<number | null>(null);
  const sendFnRef = useRef(sendFn);
  const isProcessingRef = useRef(false);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Load queue from IndexedDB via React Query
  const { data: queue = [] } = useQuery<OutboxItem[]>({
    queryKey: ['outbox', storageKey],
    queryFn: async () => {
      const stored = await idbStorage.getItem(storageKey);
      if (!stored) return [];
      try {
        return JSON.parse(stored) as OutboxItem[];
      } catch {
        logger.warn('Failed to parse outbox queue, resetting');
        return [];
      }
    },
    staleTime: Infinity, // Queue is source of truth
    gcTime: Infinity, // Keep queue indefinitely
  });

  // Mutation to persist queue
  const persistQueueMutation = useMutation({
    mutationFn: async (newQueue: OutboxItem[]) => {
      await idbStorage.setItem(storageKey, JSON.stringify(newQueue));
      return newQueue;
    },
    onSuccess: (newQueue) => {
      queryClient.setQueryData(['outbox', storageKey], newQueue);
    },
  });

  useEffect(() => {
    sendFnRef.current = sendFn;
  }, [sendFn]);

  const persistQueue = useCallback(
    (newQueue: OutboxItem[]) => {
      persistQueueMutation.mutate(newQueue);
    },
    [persistQueueMutation]
  );

  const processQueue = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current || !isOnlineRef.current) {
      return;
    }

    const currentQueue = queue ?? [];
    if (currentQueue.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const now = Date.now();
    const ready = currentQueue.filter((item: OutboxItem) => item.nextAt <= now);

    if (ready.length === 0) {
      isProcessingRef.current = false;
      scheduleNext();
      return;
    }

    logger.debug('Processing outbox queue', {
      readyCount: ready.length,
      totalCount: currentQueue.length,
    });

    const results = await Promise.allSettled(
      ready.map(async (item: OutboxItem) => {
        try {
          await sendFnRef.current(item.payload);
          logger.debug('Successfully sent outbox item', { clientId: item.clientId });
          return { success: true, clientId: item.clientId };
        } catch (error) {
          const nextAttempt = Math.min(item.attempt + 1, maxAttempts);
          if (nextAttempt >= maxAttempts) {
            logger.error(
              'Outbox item failed after max attempts',
              error instanceof Error ? error : new Error(String(error)),
              {
                clientId: item.clientId,
                attempts: nextAttempt,
              }
            );
            return { success: false, clientId: item.clientId, failed: true };
          }
          const delay = calculateExponentialBackoff(nextAttempt, baseRetryDelay, maxDelay, jitter);
          logger.warn('Outbox item failed, will retry', {
            clientId: item.clientId,
            attempt: nextAttempt,
            delay,
          });
          return {
            success: false,
            clientId: item.clientId,
            nextAttempt,
            delay,
          };
        }
      })
    );

    const updatedQueue = currentQueue
      .map((item: OutboxItem) => {
        const result = results.find(
          (r) => r.status === 'fulfilled' && r.value.clientId === item.clientId
        ) as
          | PromiseFulfilledResult<{
              success: boolean;
              clientId: string;
              failed?: boolean;
              nextAttempt?: number;
              delay?: number;
            }>
          | undefined;

        if (!result) {
          return item;
        }

        if (result.value.success || result.value.failed) {
          return null;
        }

        if (result.value.nextAttempt != null && result.value.delay != null) {
          return {
            ...item,
            attempt: result.value.nextAttempt,
            nextAt: Date.now() + result.value.delay,
          };
        }

        return item;
      })
      .filter((item): item is OutboxItem => item != null);

    persistQueue(updatedQueue);
    isProcessingRef.current = false;
    scheduleNext();

    if (ready.length > 0 && onFlush) {
      onFlush();
    }
  }, [queue, baseRetryDelay, maxAttempts, maxDelay, jitter, onFlush, persistQueue]);

  const scheduleNext = useCallback((): void => {
    if (timerRef.current != null) {
      return;
    }

    const currentQueue = queue ?? [];
    if (currentQueue.length === 0) {
      return;
    }

    const now = Date.now();
    const nextItem = currentQueue
      .filter((item: OutboxItem) => item.nextAt > now)
      .sort((a: OutboxItem, b: OutboxItem) => a.nextAt - b.nextAt)[0];

    if (nextItem) {
      const delay = Math.max(nextItem.nextAt - now, 100);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void processQueue();
      }, delay);
    } else {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void processQueue();
      }, 300);
    }
  }, [queue, processQueue]);

  const enqueue = useCallback(
    (clientId: string, payload: unknown, idempotencyKey?: string): void => {
      const key = idempotencyKey ?? generateIdempotencyKey();

      const currentQueue = queue ?? [];
      const existingIndex = currentQueue.findIndex(
        (item: OutboxItem) => item.clientId === clientId || item.idempotencyKey === key
      );

      let updatedQueue: OutboxItem[];
      if (existingIndex >= 0) {
        updatedQueue = currentQueue.map((item: OutboxItem, index: number) =>
          index === existingIndex
            ? {
                ...item,
                payload,
                attempt: 0,
                nextAt: Date.now(),
                idempotencyKey: key,
              }
            : item
        );
      } else {
        updatedQueue = [
          ...currentQueue,
          {
            clientId,
            payload,
            attempt: 0,
            nextAt: Date.now(),
            createdAt: Date.now(),
            idempotencyKey: key,
          },
        ];
      }

      persistQueue(updatedQueue);

      if (isOnlineRef.current) {
        scheduleNext();
      }
    },
    [queue, persistQueue, scheduleNext]
  );

  const clear = useCallback((): void => {
    persistQueue([]);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isProcessingRef.current = false;
  }, [persistQueue]);

  const flush = useCallback(async (): Promise<void> => {
    if (!isOnlineRef.current) {
      return;
    }
    await processQueue();
  }, [processQueue]);

  useEffect(() => {
    const handleOnline = (): void => {
      logger.debug('Network connection restored, flushing outbox');
      isOnlineRef.current = true;
      void processQueue();
    };

    const handleOffline = (): void => {
      logger.debug('Network connection lost, pausing outbox');
      isOnlineRef.current = false;
    };

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    isOnlineRef.current = navigator.onLine;

    if (isOnlineRef.current && queue.length > 0) {
      scheduleNext();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [processQueue, scheduleNext, queue.length]);

  return {
    enqueue,
    queue: queue ?? [],
    clear,
    flush,
    isOnline: isOnlineRef.current,
  };
}
