import { useCallback, useRef } from 'react';
import type { QueuedOperation, OperationStatus } from './use-offline-queue';
import { executeAPIOperation } from './queue-processor';
import { createLogger } from '@/lib/logger';

const logger = createLogger('queue-processing');

interface UseQueueProcessingOptions {
  isOnline: boolean;
  maxRetries: number;
  retryDelay: number;
  onConflict?: (operation: QueuedOperation) => Promise<QueuedOperation | null>;
  onOperationComplete?: (operation: QueuedOperation) => void;
  onOperationError?: (operation: QueuedOperation, error: Error) => void;
  setQueue: React.Dispatch<React.SetStateAction<QueuedOperation[]>>;
  persistOperation: (operation: QueuedOperation) => Promise<void>;
  removeFromDB: (id: string) => Promise<void>;
}

export function useQueueProcessing({
  isOnline,
  maxRetries,
  retryDelay,
  onConflict,
  onOperationComplete,
  onOperationError,
  setQueue,
  persistOperation,
  removeFromDB,
}: UseQueueProcessingOptions) {
  const processingRef = useRef(new Set<string>());

  // Calculate exponential backoff delay
  const getBackoffDelay = useCallback(
    (retryCount: number): number => {
      return retryDelay * Math.pow(2, retryCount);
    },
    [retryDelay]
  );

  // Process a single operation
  const processOperation = useCallback(
    async (operation: QueuedOperation) => {
      if (!isOnline) {
        logger.debug('Cannot process operation - offline', { id: operation.id });
        return;
      }

      if (processingRef.current.has(operation.id)) {
        logger.debug('Operation already processing', { id: operation.id });
        return;
      }

      processingRef.current.add(operation.id);

      // Update status to processing
      setQueue((prev) =>
        prev.map((op) =>
          op.id === operation.id
            ? { ...op, status: 'processing' as OperationStatus, updatedAt: Date.now() }
            : op
        )
      );

      try {
        logger.debug('Processing operation', {
          id: operation.id,
          type: operation.type,
          resourceType: operation.resourceType,
        });

        // Execute API call based on operation type and resource type
        await executeAPIOperation(operation);

        // Success
        setQueue((prev) => prev.filter((op) => op.id !== operation.id));
        void removeFromDB(operation.id).catch((error) => {
          logger.error('Failed to remove operation from DB', {
            id: operation.id,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        });
        onOperationComplete?.(operation);

        logger.debug('Operation completed successfully', { id: operation.id });
      } catch (error) {
        const err = error as Error;

        // Check for conflict
        if (err.message.includes('conflict') || err.message.includes('409')) {
          if (onConflict) {
            try {
              const resolvedOp = await onConflict(operation);

              if (resolvedOp) {
                // Retry with resolved data
                setQueue((prev) =>
                  prev.map((op) =>
                    op.id === operation.id
                      ? { ...resolvedOp, status: 'pending' as OperationStatus }
                      : op
                  )
                );
                void persistOperation(resolvedOp);
              } else {
                // Conflict resolution failed - mark as conflict
                setQueue((prev) =>
                  prev.map((op) =>
                    op.id === operation.id
                      ? {
                          ...op,
                          status: 'conflict' as OperationStatus,
                          error: err,
                          updatedAt: Date.now(),
                        }
                      : op
                  )
                );
              }
            } catch (conflictError) {
              logger.error('Conflict resolution failed', conflictError);
            }
          } else {
            // No conflict handler - mark as conflict
            setQueue((prev) =>
              prev.map((op) =>
                op.id === operation.id
                  ? {
                      ...op,
                      status: 'conflict' as OperationStatus,
                      error: err,
                      updatedAt: Date.now(),
                    }
                  : op
              )
            );
          }
        } else if (operation.retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = getBackoffDelay(operation.retryCount);

          logger.debug('Operation failed - retrying', {
            id: operation.id,
            retryCount: operation.retryCount + 1,
            delay,
          });

          setTimeout(() => {
            setQueue((prev) =>
              prev.map((op) =>
                op.id === operation.id
                  ? {
                      ...op,
                      status: 'pending' as OperationStatus,
                      retryCount: op.retryCount + 1,
                      error: err,
                      updatedAt: Date.now(),
                    }
                  : op
              )
            );

            processingRef.current.delete(operation.id);
          }, delay);
        } else {
          // Max retries exceeded
          setQueue((prev) =>
            prev.map((op) =>
              op.id === operation.id
                ? {
                    ...op,
                    status: 'error' as OperationStatus,
                    error: err,
                    updatedAt: Date.now(),
                  }
                : op
            )
          );

          onOperationError?.(operation, err);

          logger.error('Operation failed - max retries exceeded', {
            id: operation.id,
            error: err,
          });
        }
      } finally {
        processingRef.current.delete(operation.id);
      }
    },
    [
      isOnline,
      maxRetries,
      getBackoffDelay,
      onConflict,
      onOperationComplete,
      onOperationError,
      removeFromDB,
      persistOperation,
      setQueue,
    ]
  );

  return { processOperation, processingRef };
}
