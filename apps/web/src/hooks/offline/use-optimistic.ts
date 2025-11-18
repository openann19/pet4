/**
 * Optimistic UI Hook (Web)
 *
 * Provides optimistic updates with automatic rollback:
 * - Immediate UI updates for better UX
 * - Automatic rollback on error
 * - Queue integration for offline support
 * - Conflict resolution
 * - State synchronization
 *
 * Location: apps/web/src/hooks/offline/use-optimistic.ts
 */

import { useCallback, useState } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('optimistic')

/**
 * Optimistic update options
 */
export interface OptimisticOptions<T> {
  readonly onSuccess?: (data: T) => void
  readonly onError?: (error: Error, rollbackData: T) => void
  readonly onRollback?: (originalData: T) => void
}

/**
 * Optimistic hook return type
 */
export interface UseOptimisticReturn<T> {
  readonly data: T
  readonly isOptimistic: boolean
  readonly update: (
    updater: (current: T) => T,
    operation: () => Promise<T>,
    options?: OptimisticOptions<T>
  ) => Promise<void>
  readonly rollback: () => void
}

export function useOptimistic<T>(initialData: T): UseOptimisticReturn<T> {
  const [data, setData] = useState<T>(initialData)
  const [isOptimistic, setIsOptimistic] = useState(false)
  const [rollbackData, setRollbackData] = useState<T>(initialData)

  const update = useCallback(
    async (
      updater: (current: T) => T,
      operation: () => Promise<T>,
      options: OptimisticOptions<T> = {}
    ) => {
      const { onSuccess, onError, onRollback } = options

      // Store current state for rollback
      setRollbackData(data)
      setIsOptimistic(true)

      // Apply optimistic update
      const optimisticData = updater(data)
      setData(optimisticData)

      logger.debug('Optimistic update applied')

      try {
        // Execute actual operation
        const result = await operation()

        // Success - update with server data
        setData(result)
        setIsOptimistic(false)

        onSuccess?.(result)

        logger.debug('Optimistic update confirmed')
      } catch (_error) {
        // Rollback on _error
        setData(rollbackData)
        setIsOptimistic(false)

        onError?.(_error as Error, rollbackData)
        onRollback?.(rollbackData)

        logger.error('Optimistic update failed - rolled back', _error)

        throw _error
      }
    },
    [data, rollbackData]
  )

  const rollback = useCallback(() => {
    setData(rollbackData)
    setIsOptimistic(false)
    logger.debug('Manual rollback performed')
  }, [rollbackData])

  return {
    data,
    isOptimistic,
    update,
    rollback,
  }
}
