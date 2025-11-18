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

import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/lib/logger'
import { APIClient } from '@/lib/api-client'
import { ENDPOINTS } from '@/lib/endpoints'

const logger = createLogger('offline-queue')

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
  | 'custom'

/**
 * Operation status
 */
export type OperationStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'conflict'

/**
 * Operation priority
 */
export type OperationPriority = 'high' | 'medium' | 'low'

/**
 * Queued operation
 */
export interface QueuedOperation<T = unknown> {
  readonly id: string
  readonly type: OperationType
  readonly resourceType: string // e.g., 'message', 'post', 'reaction'
  readonly resourceId?: string
  readonly data: T
  readonly optimisticData?: T
  readonly status: OperationStatus
  readonly priority: OperationPriority
  readonly retryCount: number
  readonly maxRetries: number
  readonly createdAt: number
  readonly updatedAt: number
  readonly error?: Error
  readonly batchId?: string // For batch operations
  readonly version?: number // For versioning
}

/**
 * Offline queue options
 */
export interface UseOfflineQueueOptions {
  readonly maxRetries?: number
  readonly retryDelay?: number // Base delay in ms
  readonly maxQueueSize?: number
  readonly persistToIndexedDB?: boolean
  readonly enableBatchOperations?: boolean
  readonly enablePriorityQueue?: boolean
  readonly enableAutoCleanup?: boolean
  readonly cleanupAge?: number // Age in ms for cleanup (default: 7 days)
  readonly onOperationComplete?: (operation: QueuedOperation) => void
  readonly onOperationError?: (operation: QueuedOperation, error: Error) => void
  readonly onConflict?: (operation: QueuedOperation) => Promise<QueuedOperation | null>
}

/**
 * Offline queue return type
 */
export interface UseOfflineQueueReturn {
  readonly isOnline: boolean
  readonly queue: readonly QueuedOperation[]
  readonly pendingCount: number
  readonly processingCount: number
  readonly enqueue: <T>(
    type: OperationType,
    resourceType: string,
    data: T,
    options?: Partial<QueuedOperation<T>>
  ) => string
  readonly enqueueBatch: <T>(
    operations: {
      type: OperationType
      resourceType: string
      data: T
      options?: Partial<QueuedOperation<T>>
    }[]
  ) => string[]
  readonly dequeue: (id: string) => void
  readonly retry: (id: string) => Promise<void>
  readonly retryAll: () => Promise<void>
  readonly clear: () => void
  readonly clearCompleted: () => void
  readonly cleanup: () => void
  readonly getOperation: (id: string) => QueuedOperation | undefined
  readonly getBatch: (batchId: string) => QueuedOperation[]
  readonly prioritize: (id: string, priority: OperationPriority) => void
}

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // ms
const DEFAULT_MAX_QUEUE_SIZE = 100
const DEFAULT_CLEANUP_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days
const DB_NAME = 'petspark-offline'
const DB_VERSION = 2 // Incremented for versioning support
const STORE_NAME = 'operations'

let operationIdCounter = 0

/**
 * Execute API operation based on operation type and resource type
 */
async function executeAPIOperation(operation: QueuedOperation): Promise<void> {
  const { type, resourceType, resourceId, data } = operation

  try {
    switch (resourceType) {
      case 'message': {
        if (type === 'send-message' && resourceId) {
          await APIClient.post(ENDPOINTS.CHAT.SEND_MESSAGE(resourceId), data)
        }
        break
      }

      case 'post': {
        if (type === 'create') {
          await APIClient.post(ENDPOINTS.COMMUNITY.CREATE_POST, data)
        } else if (type === 'update' && resourceId) {
          await APIClient.patch(ENDPOINTS.COMMUNITY.POST(resourceId), data)
        } else if (type === 'delete' && resourceId) {
          await APIClient.delete(ENDPOINTS.COMMUNITY.POST(resourceId))
        }
        break
      }

      case 'reaction': {
        if (type === 'react' && resourceId) {
          await APIClient.post(ENDPOINTS.COMMUNITY.LIKE_POST(resourceId), data)
        }
        break
      }

      case 'comment': {
        if (type === 'create' && resourceId) {
          await APIClient.post(ENDPOINTS.COMMUNITY.COMMENT(resourceId), data)
        }
        break
      }

      case 'pet': {
        if (type === 'create') {
          await APIClient.post(ENDPOINTS.USERS.PROFILE, data)
        } else if (type === 'update') {
          await APIClient.patch(ENDPOINTS.USERS.UPDATE_PROFILE, data)
        }
        break
      }

      case 'adoption': {
        if (type === 'create') {
          await APIClient.post(ENDPOINTS.ADOPTION.CREATE_LISTING, data)
        } else if (type === 'update' && resourceId) {
          await APIClient.patch(ENDPOINTS.ADOPTION.UPDATE_LISTING(resourceId), data)
        } else if (type === 'delete' && resourceId) {
          await APIClient.delete(ENDPOINTS.ADOPTION.DELETE_LISTING(resourceId))
        }
        break
      }

      case 'upload': {
        if (type === 'upload') {
          await APIClient.post(ENDPOINTS.UPLOADS.SIGN_URL, data)
        }
        break
      }

      default: {
        // For custom operations, use the SYNC endpoint
        if (type === 'custom') {
          await APIClient.post(ENDPOINTS.SYNC.SYNC_ACTION, {
            action: resourceType,
            data,
            resourceId,
          })
        } else {
          logger.warn('Unknown operation type/resource type combination', {
            type,
            resourceType,
            id: operation.id,
          })
          // Fallback: Use generic sync endpoint
          await APIClient.post(ENDPOINTS.SYNC.SYNC_ACTION, {
            type,
            resourceType,
            resourceId,
            data,
          })
        }
        break
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('API operation failed', {
      id: operation.id,
      type,
      resourceType,
      error: err,
    })
    throw err
  }
}

export function useOfflineQueue(
  options: UseOfflineQueueOptions = {}
): UseOfflineQueueReturn {
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
  } = options

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queue, setQueue] = useState<QueuedOperation[]>([])

  // Refs
  const dbRef = useRef<IDBDatabase | null>(null)
  const processingRef = useRef(new Set<string>())

  // Initialize IndexedDB
  useEffect(() => {
    if (!persistToIndexedDB) {
      return
    }

    const openDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          logger.error('Failed to open IndexedDB', request.error)
        }

        request.onsuccess = () => {
          dbRef.current = request.result
          logger.debug('IndexedDB opened successfully')

          // Load persisted queue
          void loadQueueFromDB()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            store.createIndex('status', 'status', { unique: false })
            store.createIndex('createdAt', 'createdAt', { unique: false })
            store.createIndex('priority', 'priority', { unique: false })
            store.createIndex('batchId', 'batchId', { unique: false })
            store.createIndex('version', 'version', { unique: false })
            logger.debug('IndexedDB object store created with indexes')
          } else {
            // Upgrade existing store
            const transaction = (event.target as IDBOpenDBRequest).transaction
            if (transaction) {
              const store = transaction.objectStore(STORE_NAME)

              // Add new indexes if they don't exist
              if (!store.indexNames.contains('priority')) {
                store.createIndex('priority', 'priority', { unique: false })
              }
              if (!store.indexNames.contains('batchId')) {
                store.createIndex('batchId', 'batchId', { unique: false })
              }
              if (!store.indexNames.contains('version')) {
                store.createIndex('version', 'version', { unique: false })
              }
              logger.debug('IndexedDB store upgraded with new indexes')
            }
          }
        }
      } catch (error) {
        logger.error('IndexedDB initialization failed', error)
      }
    }

    void openDB()

    return () => {
      if (dbRef.current) {
        dbRef.current.close()
        dbRef.current = null
      }
    }
  }, [persistToIndexedDB])

  // Load queue from IndexedDB
  const loadQueueFromDB = useCallback(async () => {
    if (!dbRef.current) {
      return
    }

    try {
      const transaction = dbRef.current.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const operations = request.result as QueuedOperation[]
        setQueue(operations.filter((op) => op.status === 'pending'))
        logger.debug('Loaded queue from IndexedDB', {
          count: operations.length,
        })
      }

      request.onerror = () => {
        logger.error('Failed to load queue from IndexedDB', request.error)
      }
    } catch (error) {
      logger.error('Error loading queue from IndexedDB', error)
    }
  }, [])

  // Persist operation to IndexedDB
  const persistOperation = useCallback(
    async (operation: QueuedOperation) => {
      if (!persistToIndexedDB || !dbRef.current) {
        return
      }

      try {
        const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        store.put(operation)

        transaction.oncomplete = () => {
          logger.debug('Operation persisted to IndexedDB', { id: operation.id })
        }

        transaction.onerror = () => {
          logger.error('Failed to persist operation', transaction.error)
        }
      } catch (error) {
        logger.error('Error persisting operation', error)
      }
    },
    [persistToIndexedDB]
  )

  // Remove operation from IndexedDB
  const removeFromDB = useCallback(
    async (id: string) => {
      if (!persistToIndexedDB || !dbRef.current) {
        return
      }

      try {
        const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        store.delete(id)

        logger.debug('Operation removed from IndexedDB', { id })
      } catch (error) {
        logger.error('Error removing operation from IndexedDB', error)
      }
    },
    [persistToIndexedDB]
  )

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      logger.debug('Network online - processing queue')
    }

    const handleOffline = () => {
      setIsOnline(false)
      logger.debug('Network offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sort queue by priority
  const sortQueueByPriority = useCallback((ops: QueuedOperation[]): QueuedOperation[] => {
    if (!enablePriorityQueue) {
      return ops
    }

    const priorityOrder: Record<OperationPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    }

    return [...ops].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority ?? 'medium'] - priorityOrder[b.priority ?? 'medium']
      if (priorityDiff !== 0) {
        return priorityDiff
      }
      // If same priority, sort by creation time
      return a.createdAt - b.createdAt
    })
  }, [enablePriorityQueue])

  // Calculate exponential backoff delay
  const getBackoffDelay = useCallback(
    (retryCount: number): number => {
      return retryDelay * Math.pow(2, retryCount)
    },
    [retryDelay]
  )

  // Process a single operation
  const processOperation = useCallback(
    async (operation: QueuedOperation) => {
      if (!isOnline) {
        logger.debug('Cannot process operation - offline', { id: operation.id })
        return
      }

      if (processingRef.current.has(operation.id)) {
        logger.debug('Operation already processing', { id: operation.id })
        return
      }

      processingRef.current.add(operation.id)

      // Update status to processing
      setQueue((prev) =>
        prev.map((op) =>
          op.id === operation.id
            ? { ...op, status: 'processing' as OperationStatus, updatedAt: Date.now() }
            : op
        )
      )

      try {
        logger.debug('Processing operation', {
          id: operation.id,
          type: operation.type,
          resourceType: operation.resourceType,
        })

        // Execute API call based on operation type and resource type
        await executeAPIOperation(operation)

        // Success
        setQueue((prev) => prev.filter((op) => op.id !== operation.id))
        void removeFromDB(operation.id).catch((error) => {
          logger.error('Failed to remove operation from DB', {
            id: operation.id,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        });
        onOperationComplete?.(operation)

        logger.debug('Operation completed successfully', { id: operation.id })
      } catch (error) {
        const err = error as Error

        // Check for conflict
        if (err.message.includes('conflict') || err.message.includes('409')) {
          if (onConflict) {
            try {
              const resolvedOp = await onConflict(operation)

              if (resolvedOp) {
                // Retry with resolved data
                setQueue((prev) =>
                  prev.map((op) =>
                    op.id === operation.id
                      ? { ...resolvedOp, status: 'pending' as OperationStatus }
                      : op
                  )
                )
                void persistOperation(resolvedOp)
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
                )
              }
            } catch (conflictError) {
              logger.error('Conflict resolution failed', conflictError)
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
            )
          }
        } else if (operation.retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = getBackoffDelay(operation.retryCount)

          logger.debug('Operation failed - retrying', {
            id: operation.id,
            retryCount: operation.retryCount + 1,
            delay,
          })

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
            )

            processingRef.current.delete(operation.id)
          }, delay)
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
          )

          onOperationError?.(operation, err)

          logger.error('Operation failed - max retries exceeded', {
            id: operation.id,
            error: err,
          })
        }
      } finally {
        processingRef.current.delete(operation.id)
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
    ]
  )

  // Process queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const pendingOps = queue.filter((op) => op.status === 'pending')
      const sortedOps = sortQueueByPriority(pendingOps)
      sortedOps.forEach((op) => {
        if (!processingRef.current.has(op.id)) {
          void processOperation(op).catch((error) => {
            logger.error('Failed to process operation', {
              id: op.id,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          });
        }
      })
    }
  }, [isOnline, queue, sortQueueByPriority, processOperation])

  // Enqueue operation
  const enqueue = useCallback(
    <T,>(
      type: OperationType,
      resourceType: string,
      data: T,
      operationOptions?: Partial<QueuedOperation<T>>
    ): string => {
      if (queue.length >= maxQueueSize) {
        logger.warn('Queue is full - cannot enqueue operation')
        throw new Error('Queue is full')
      }

      const id = `op-${++operationIdCounter}-${Date.now()}`

      const operation: QueuedOperation<T> = {
        id,
        type,
        resourceType,
        data,
        status: 'pending',
        priority: (operationOptions?.priority ?? 'medium'),
        retryCount: 0,
        maxRetries: operationOptions?.maxRetries ?? maxRetries,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: operationOptions?.version ?? 1,
        ...operationOptions,
      }

      setQueue((prev) => [...prev, operation])
      void persistOperation(operation)

      logger.debug('Operation enqueued', {
        id,
        type,
        resourceType,
      })

      // Process immediately if online
      if (isOnline) {
        void processOperation(operation)
      }

      return id
    },
    [queue.length, maxQueueSize, maxRetries, isOnline, persistOperation, processOperation]
  )

  // Dequeue operation
  const dequeue = useCallback(
    (id: string) => {
      setQueue((prev) => prev.filter((op) => op.id !== id))
      void removeFromDB(id).catch((error) => {
        logger.error('Failed to remove operation from DB on dequeue', {
          id,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
      logger.debug('Operation dequeued', { id })
    },
    [removeFromDB]
  )

  // Retry operation
  const retry = useCallback(
    async (id: string) => {
      const operation = queue.find((op) => op.id === id)

      if (!operation) {
        logger.warn('Operation not found for retry', { id })
        return
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
      )

      if (isOnline) {
        await processOperation(operation)
      }
    },
    [queue, isOnline, processOperation]
  )

  // Retry all failed operations
  const retryAll = useCallback(async () => {
    const failedOps = queue.filter((op) => op.status === 'error' || op.status === 'conflict')

    for (const op of failedOps) {
      await retry(op.id)
    }

    logger.debug('Retrying all failed operations', { count: failedOps.length })
  }, [queue, retry])

  // Enqueue batch operations
  const enqueueBatch = useCallback(
    <T,>(
      operations: {
        type: OperationType
        resourceType: string
        data: T
        options?: Partial<QueuedOperation<T>>
      }[]
    ): string[] => {
      if (!enableBatchOperations) {
        throw new Error('Batch operations are not enabled')
      }

      if (queue.length + operations.length > maxQueueSize) {
        logger.warn('Queue would exceed max size - cannot enqueue batch')
        throw new Error('Queue would exceed max size')
      }

      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const operationIds: string[] = []

      operations.forEach((op) => {
        const id = enqueue(op.type, op.resourceType, op.data, {
          ...op.options,
          batchId,
        })
        operationIds.push(id)
      })

      logger.debug('Batch operations enqueued', {
        batchId,
        count: operations.length,
      })

      return operationIds
    },
    [enableBatchOperations, queue.length, maxQueueSize, enqueue]
  )

  // Get batch operations
  const getBatch = useCallback(
    (batchId: string): QueuedOperation[] => {
      return queue.filter((op) => op.batchId === batchId)
    },
    [queue]
  )

  // Prioritize operation
  const prioritize = useCallback(
    (id: string, priority: OperationPriority) => {
      setQueue((prev) =>
        prev.map((op) =>
          op.id === id
            ? { ...op, priority, updatedAt: Date.now() }
            : op
        )
      )

      const operation = queue.find((op) => op.id === id)
      if (operation) {
        const updatedOp = { ...operation, priority, updatedAt: Date.now() }
        void persistOperation(updatedOp)
      }

      logger.debug('Operation prioritized', { id, priority })
    },
    [queue, persistOperation]
  )

  // Clear completed operations
  const clearCompleted = useCallback(() => {
    const completedOps = queue.filter(
      (op) => op.status === 'success' || op.status === 'cancelled'
    )

    setQueue((prev) =>
      prev.filter((op) => op.status !== 'success' && op.status !== 'cancelled')
    )

    // Remove from DB
    if (persistToIndexedDB && dbRef.current) {
      completedOps.forEach((op) => {
        void removeFromDB(op.id).catch((error) => {
          logger.error('Failed to remove completed operation from DB', {
            id: op.id,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        });
      })
    }

    logger.debug('Completed operations cleared', { count: completedOps.length })
  }, [queue, persistToIndexedDB, removeFromDB])

  // Cleanup old operations
  const cleanup = useCallback(() => {
    const now = Date.now()
    const oldOps = queue.filter(
      (op) => now - op.createdAt > cleanupAge && (op.status === 'success' || op.status === 'error')
    )

    setQueue((prev) =>
      prev.filter(
        (op) => !(now - op.createdAt > cleanupAge && (op.status === 'success' || op.status === 'error'))
      )
    )

    // Remove from DB
    if (persistToIndexedDB && dbRef.current) {
      oldOps.forEach((op) => {
        void removeFromDB(op.id).catch((error) => {
          logger.error('Failed to remove old operation from DB', {
            id: op.id,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        });
      })
    }

    logger.debug('Old operations cleaned up', {
      count: oldOps.length,
      age: cleanupAge,
    })
  }, [queue, cleanupAge, persistToIndexedDB, removeFromDB])

  // Auto cleanup effect
  useEffect(() => {
    if (!enableAutoCleanup) {
      return
    }

    const interval = setInterval(() => {
      cleanup()
    }, 60 * 60 * 1000) // Run cleanup every hour

    return () => {
      clearInterval(interval)
    }
  }, [enableAutoCleanup, cleanup])

  // Clear queue
  const clear = useCallback(() => {
    setQueue([])

    if (persistToIndexedDB && dbRef.current) {
      const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.clear()
      logger.debug('Queue cleared')
    }
  }, [persistToIndexedDB])

  // Get operation by ID
  const getOperation = useCallback(
    (id: string): QueuedOperation | undefined => {
      return queue.find((op) => op.id === id)
    },
    [queue]
  )

  // Calculate counts
  const pendingCount = queue.filter((op) => op.status === 'pending').length
  const processingCount = queue.filter((op) => op.status === 'processing').length

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
  }
}
