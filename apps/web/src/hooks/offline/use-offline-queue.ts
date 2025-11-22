/**
 * Offline Queue Manager Hook (Web)
 *
 * Provides robust offline-first architecture with:
 * - Persistent queue for offline operations
 * - Optimistic UI updates
 * - Intelligent retry with exponential backoff
 * - Conflict resolution
 * - Background sync when online
 * - IndexedDB persistence
 *
 * Location: apps/web/src/hooks/offline/use-offline-queue.ts
 */

import { useCallback, useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { useIndexedDB } from './use-indexed-db';
import { useQueueProcessing } from './use-queue-processing';
import { useQueueManager } from './use-queue-manager';

const logger = createLogger('offline-queue');

/**
 * Operation type
 */
export type OperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'send-message'
  | 'react'
  | 'custom';

/**
 * Operation status
 */
export type OperationStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'conflict';

/**
 * Operation priority
 */
export type OperationPriority = 'high' | 'medium' | 'low';

/**
 * Queued operation
 */
export interface QueuedOperation<T = unknown> {
  readonly id: string;
  readonly type: OperationType;
  readonly resourceType: string; // e.g., 'message', 'post', 'reaction'
  readonly resourceId?: string;
  readonly data: T;
  readonly optimisticData?: T;
  readonly status: OperationStatus;
  readonly priority: OperationPriority;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly error?: Error;
  readonly batchId?: string; // For batch operations
  readonly version?: number; // For versioning
}

/**
 * Offline queue options
 */
export interface UseOfflineQueueOptions {
  readonly maxRetries?: number;
  readonly retryDelay?: number; // Base delay in ms
  readonly maxQueueSize?: number;
  readonly persistToIndexedDB?: boolean;
  readonly enableBatchOperations?: boolean;
  readonly enablePriorityQueue?: boolean;
  readonly enableAutoCleanup?: boolean;
  readonly cleanupAge?: number; // Age in ms for cleanup (default: 7 days)
  readonly onOperationComplete?: (operation: QueuedOperation) => void;
  readonly onOperationError?: (operation: QueuedOperation, error: Error) => void;
  readonly onConflict?: (operation: QueuedOperation) => Promise<QueuedOperation | null>;
}

/**
 * Offline queue return type
 */
export interface UseOfflineQueueReturn {
  readonly isOnline: boolean;
  readonly queue: readonly QueuedOperation[];
  readonly pendingCount: number;
  readonly processingCount: number;
  readonly enqueue: <T>(
    type: OperationType,
    resourceType: string,
    data: T,
    options?: Partial<QueuedOperation<T>>
  ) => string;
  readonly enqueueBatch: <T>(
    operations: {
      type: OperationType;
      resourceType: string;
      data: T;
      options?: Partial<QueuedOperation<T>>;
    }[]
  ) => string[];
  readonly dequeue: (id: string) => void;
  readonly retry: (id: string) => Promise<void>;
  readonly retryAll: () => Promise<void>;
  readonly clear: () => void;
  readonly clearCompleted: () => void;
  readonly cleanup: () => void;
  readonly getOperation: (id: string) => QueuedOperation | undefined;
  readonly getBatch: (batchId: string) => QueuedOperation[];
  readonly prioritize: (id: string, priority: OperationPriority) => void;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // ms
const DEFAULT_MAX_QUEUE_SIZE = 100;
const DEFAULT_CLEANUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useOfflineQueue(options: UseOfflineQueueOptions = {}): UseOfflineQueueReturn {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    maxQueueSize = DEFAULT_MAX_QUEUE_SIZE,
    persistToIndexedDB = true,
    enableBatchOperations = false,
    enablePriorityQueue = true,
    enableAutoCleanup = true,
    cleanupAge = DEFAULT_CLEANUP_AGE,
    onOperationComplete,
    onOperationError,
    onConflict,
  } = options;

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedOperation[]>([]);

  // IndexedDB Hook
  const {
    isReady: isDBReady,
    loadQueue,
    persistOperation,
    removeOperation,
    clearStore,
  } = useIndexedDB(persistToIndexedDB);

  // Load queue from IndexedDB
  useEffect(() => {
    if (isDBReady) {
      void loadQueue().then((operations) => {
        setQueue(operations.filter((op) => op.status === 'pending'));
        logger.debug('Loaded queue from IndexedDB', { count: operations.length });
      });
    }
  }, [isDBReady, loadQueue]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.debug('Network online - processing queue');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.debug('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue Processing Hook
  const { processOperation, processingRef } = useQueueProcessing({
    isOnline,
    maxRetries,
    retryDelay,
    onConflict,
    onOperationComplete,
    onOperationError,
    setQueue,
    persistOperation,
    removeFromDB: removeOperation,
  });

  // Queue Manager Hook
  const {
    enqueue,
    dequeue,
    retry,
    retryAll,
    enqueueBatch,
    getBatch,
    prioritize,
    clear,
    getOperation,
  } = useQueueManager({
    queue,
    setQueue,
    maxQueueSize,
    maxRetries,
    enableBatchOperations,
    persistOperation,
    removeOperation,
    clearStore,
    isOnline,
    processOperation,
  });

  // Sort queue by priority
  const sortQueueByPriority = useCallback(
    (ops: QueuedOperation[]): QueuedOperation[] => {
      if (!enablePriorityQueue) {
        return ops;
      }

      const priorityOrder: Record<OperationPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      return [...ops].sort((a, b) => {
        const priorityDiff =
          priorityOrder[a.priority ?? 'medium'] - priorityOrder[b.priority ?? 'medium'];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        // If same priority, sort by creation time
        return a.createdAt - b.createdAt;
      });
    },
    [enablePriorityQueue]
  );

  // Process queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const pendingOps = queue.filter((op) => op.status === 'pending');
      const sortedOps = sortQueueByPriority(pendingOps);
      sortedOps.forEach((op) => {
        if (!processingRef.current.has(op.id)) {
          void processOperation(op).catch((error) => {
            logger.error('Failed to process operation', {
              id: op.id,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          });
        }
      });
    }
  }, [isOnline, queue, sortQueueByPriority, processOperation, processingRef]);

  // Clear completed operations
  const clearCompleted = useCallback(() => {
    const completedOps = queue.filter((op) => op.status === 'success' || op.status === 'cancelled');

    setQueue((prev) => prev.filter((op) => op.status !== 'success' && op.status !== 'cancelled'));

    // Remove from DB
    completedOps.forEach((op) => {
      void removeOperation(op.id).catch((error) => {
        logger.error('Failed to remove completed operation from DB', {
          id: op.id,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    });

    logger.debug('Completed operations cleared', { count: completedOps.length });
  }, [queue, removeOperation]);

  // Cleanup old operations
  const cleanup = useCallback(() => {
    const now = Date.now();
    const oldOps = queue.filter(
      (op) => now - op.createdAt > cleanupAge && (op.status === 'success' || op.status === 'error')
    );

    setQueue((prev) =>
      prev.filter(
        (op) =>
          !(now - op.createdAt > cleanupAge && (op.status === 'success' || op.status === 'error'))
      )
    );

    // Remove from DB
    oldOps.forEach((op) => {
      void removeOperation(op.id).catch((error) => {
        logger.error('Failed to remove old operation from DB', {
          id: op.id,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    });

    logger.debug('Old operations cleaned up', {
      count: oldOps.length,
      age: cleanupAge,
    });
  }, [queue, cleanupAge, removeOperation]);

  // Auto cleanup effect
  useEffect(() => {
    if (!enableAutoCleanup) {
      return;
    }

    const interval = setInterval(
      () => {
        cleanup();
      },
      60 * 60 * 1000
    ); // Run cleanup every hour

    return () => {
      clearInterval(interval);
    };
  }, [enableAutoCleanup, cleanup]);

  // Calculate counts
  const pendingCount = queue.filter((op) => op.status === 'pending').length;
  const processingCount = queue.filter((op) => op.status === 'processing').length;

  return {
    isOnline,
    queue,
    pendingCount,
    processingCount,
    enqueue,
    enqueueBatch,
    dequeue,
    retry,
    retryAll,
    clear,
    clearCompleted,
    cleanup,
    getOperation,
    getBatch,
    prioritize,
  };
}
