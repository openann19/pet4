/**
 * Offline Data Hook (Web)
 *
 * React hook for offline-first data management.
 * Provides optimistic updates, caching, and conflict resolution.
 *
 * Location: apps/web/src/hooks/offline/use-offline-data.ts
 */

import { useState, useEffect, useCallback } from 'react'
import { getOfflineDataLayer, type OfflineDataLayerOptions } from '@/lib/offline-data-layer'
import { createLogger } from '@/lib/logger'

const logger = createLogger('use-offline-data')

/**
 * Offline data hook options
 */
export interface UseOfflineDataOptions extends OfflineDataLayerOptions {
  readonly resourceType: string
  readonly resourceId: string
  readonly enableOptimisticUpdates?: boolean
  readonly enableAutoSync?: boolean
}

/**
 * Offline data hook return type
 */
export interface UseOfflineDataReturn<T> {
  readonly data: T | null
  readonly isLoading: boolean
  readonly error: Error | null
  readonly update: (data: T) => Promise<string>
  readonly commit: (updateId: string) => Promise<void>
  readonly rollback: (updateId: string) => Promise<void>
  readonly refresh: () => Promise<void>
  readonly clear: () => Promise<void>
}

/**
 * Offline Data Hook
 *
 * @example
 * ```tsx
 * const { data, update, commit } = useOfflineData({
 *   resourceType: 'pet',
 *   resourceId: '123',
 *   enableOptimisticUpdates: true,
 * });
 * ```
 */
export function useOfflineData<T>(
  options: UseOfflineDataOptions
): UseOfflineDataReturn<T> {
  const {
    resourceType,
    resourceId,
    enableOptimisticUpdates = true,
    enableAutoSync = true,
    ...layerOptions
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const dataLayer = getOfflineDataLayer(layerOptions)

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const cachedData = await dataLayer.get<T>(resourceType, resourceId)
      setData(cachedData)
      logger.debug('Data loaded from cache', { resourceType, resourceId })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      logger.error('Failed to load data', { error, resourceType, resourceId })
    } finally {
      setIsLoading(false)
    }
  }, [resourceType, resourceId, dataLayer])

  // Update data
  const update = useCallback(
    async (newData: T): Promise<string> => {
      try {
        if (enableOptimisticUpdates) {
          const currentData = data
          const updateId = await dataLayer.applyOptimisticUpdate(
            resourceType,
            resourceId,
            newData,
            currentData ?? undefined
          )
          setData(newData)
          logger.debug('Optimistic update applied', { updateId, resourceType, resourceId })
          return updateId
        } else {
          await dataLayer.set(resourceType, resourceId, newData)
          setData(newData)
          logger.debug('Data updated', { resourceType, resourceId })
          return `update-${Date.now()}`
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        logger.error('Failed to update data', { error, resourceType, resourceId })
        throw error
      }
    },
    [resourceType, resourceId, data, enableOptimisticUpdates, dataLayer]
  )

  // Commit update
  const commit = useCallback(
    async (updateId: string) => {
      try {
        await dataLayer.commitOptimisticUpdate(updateId)
        logger.debug('Update committed', { updateId })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        logger.error('Failed to commit update', { error, updateId })
        throw error
      }
    },
    [dataLayer]
  )

  // Rollback update
  const rollback = useCallback(
    async (updateId: string) => {
      try {
        await dataLayer.rollbackOptimisticUpdate(updateId)
        await loadData() // Reload data after rollback
        logger.debug('Update rolled back', { updateId })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        logger.error('Failed to rollback update', { error, updateId })
        throw error
      }
    },
    [dataLayer, loadData]
  )

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Clear data
  const clear = useCallback(async () => {
    try {
      await dataLayer.clearCache()
      setData(null)
      logger.debug('Data cleared', { resourceType, resourceId })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      logger.error('Failed to clear data', { error, resourceType, resourceId })
    }
  }, [resourceType, resourceId, dataLayer])

  // Load data on mount
  useEffect(() => {
    void loadData()
  }, [loadData])

  return {
    data,
    isLoading,
    error,
    update,
    commit,
    rollback,
    refresh,
    clear,
  }
}
