import { useCallback } from 'react';
import type {
  QueuedOperation,
  OperationType,
  OperationPriority,
  OperationStatus,
} from './use-offline-queue';
import { createLogger } from '@/lib/logger';

const logger = createLogger('queue-manager');
let operationIdCounter = 0;

interface UseQueueManagerOptions {
  queue: QueuedOperation[];
  setQueue: React.Dispatch<React.SetStateAction<QueuedOperation[]>>;
  maxQueueSize: number;
  maxRetries: number;
  enableBatchOperations: boolean;
  persistOperation: (operation: QueuedOperation) => Promise<void>;
  removeOperation: (id: string) => Promise<void>;
  clearStore: () => Promise<void>;
  isOnline: boolean;
  processOperation: (operation: QueuedOperation) => Promise<void>;
}

export function useQueueManager({
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
}: UseQueueManagerOptions) {
  // Enqueue operation
  const enqueue = useCallback(
    <T>(
      type: OperationType,
      resourceType: string,
      data: T,
      operationOptions?: Partial<QueuedOperation<T>>
    ): string => {
      if (queue.length >= maxQueueSize) {
        logger.warn('Queue is full - cannot enqueue operation');
        throw new Error('Queue is full');
      }

      const id = `op-${++operationIdCounter}-${Date.now()}`;

      const operation: QueuedOperation<T> = {
        id,
        type,
        resourceType,
        data,
        status: 'pending',
        priority: operationOptions?.priority ?? 'medium',
        retryCount: 0,
        maxRetries: operationOptions?.maxRetries ?? maxRetries,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: operationOptions?.version ?? 1,
        ...operationOptions,
      };

      setQueue((prev) => [...prev, operation]);
      void persistOperation(operation);

      logger.debug('Operation enqueued', {
        id,
        type,
        resourceType,
      });

      // Process immediately if online
      if (isOnline) {
        void processOperation(operation);
      }

      return id;
    },
    [queue.length, maxQueueSize, maxRetries, isOnline, persistOperation, processOperation, setQueue]
  );

  // Dequeue operation
  const dequeue = useCallback(
    (id: string) => {
      setQueue((prev) => prev.filter((op) => op.id !== id));
      void removeOperation(id).catch((error) => {
        logger.error('Failed to remove operation from DB on dequeue', {
          id,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
      logger.debug('Operation dequeued', { id });
    },
    [removeOperation, setQueue]
  );

  // Retry operation
  const retry = useCallback(
    async (id: string) => {
      const operation = queue.find((op) => op.id === id);

      if (!operation) {
        logger.warn('Operation not found for retry', { id });
        return;
      }

      setQueue((prev) =>
        prev.map((op) =>
          op.id === id
            ? {
                ...op,
                status: 'pending' as OperationStatus,
                retryCount: 0,
                error: undefined,
                updatedAt: Date.now(),
              }
            : op
        )
      );

      if (isOnline) {
        await processOperation(operation);
      }
    },
    [queue, isOnline, processOperation, setQueue]
  );

  // Retry all failed operations
  const retryAll = useCallback(async () => {
    const failedOps = queue.filter((op) => op.status === 'error' || op.status === 'conflict');

    for (const op of failedOps) {
      await retry(op.id);
    }

    logger.debug('Retrying all failed operations', { count: failedOps.length });
  }, [queue, retry]);

  // Enqueue batch operations
  const enqueueBatch = useCallback(
    <T>(
      operations: {
        type: OperationType;
        resourceType: string;
        data: T;
        options?: Partial<QueuedOperation<T>>;
      }[]
    ): string[] => {
      if (!enableBatchOperations) {
        throw new Error('Batch operations are not enabled');
      }

      if (queue.length + operations.length > maxQueueSize) {
        logger.warn('Queue would exceed max size - cannot enqueue batch');
        throw new Error('Queue would exceed max size');
      }

      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const operationIds: string[] = [];

      operations.forEach((op) => {
        const id = enqueue(op.type, op.resourceType, op.data, {
          ...op.options,
          batchId,
        });
        operationIds.push(id);
      });

      logger.debug('Batch operations enqueued', {
        batchId,
        count: operations.length,
      });

      return operationIds;
    },
    [enableBatchOperations, queue.length, maxQueueSize, enqueue]
  );

  // Get batch operations
  const getBatch = useCallback(
    (batchId: string): QueuedOperation[] => {
      return queue.filter((op) => op.batchId === batchId);
    },
    [queue]
  );

  // Prioritize operation
  const prioritize = useCallback(
    (id: string, priority: OperationPriority) => {
      setQueue((prev) =>
        prev.map((op) => (op.id === id ? { ...op, priority, updatedAt: Date.now() } : op))
      );

      const operation = queue.find((op) => op.id === id);
      if (operation) {
        const updatedOp = { ...operation, priority, updatedAt: Date.now() };
        void persistOperation(updatedOp);
      }

      logger.debug('Operation prioritized', { id, priority });
    },
    [queue, persistOperation, setQueue]
  );

  // Clear queue
  const clear = useCallback(() => {
    setQueue([]);
    void clearStore();
    logger.debug('Queue cleared');
  }, [clearStore, setQueue]);

  // Get operation by ID
  const getOperation = useCallback(
    (id: string): QueuedOperation | undefined => {
      return queue.find((op) => op.id === id);
    },
    [queue]
  );

  return {
    enqueue,
    dequeue,
    retry,
    retryAll,
    enqueueBatch,
    getBatch,
    prioritize,
    clear,
    getOperation,
  };
}
