/**
 * useStorage Hook
 *
 * React hook replacement for useKV from @github/spark/hooks
 * Provides reactive storage state management using the storage service.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { storage } from '@/lib/storage'
import { createLogger } from '@/lib/logger'

const logger = createLogger('useStorage')

/**
 * Hook to access and manage storage values
 *
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue, deleteValue] tuple
 */
export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValueState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const defaultValueRef = useRef(defaultValue)
  const keyRef = useRef(key)
  const isInitializedRef = useRef(false)

  // Update defaultValue ref if it changes
  useEffect(() => {
    defaultValueRef.current = defaultValue
  }, [defaultValue])

  // Handle key changes
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key
      isInitializedRef.current = false
      setIsLoading(true)
    }
  }, [key])

  // Load initial value
  useEffect(() => {
    let cancelled = false

    const loadValue = async (): Promise<void> => {
      try {
        const stored = await storage.get<T>(key)

        if (!cancelled) {
          setValueState(stored !== null && stored !== undefined ? stored : defaultValueRef.current)
          setIsLoading(false)
          isInitializedRef.current = true
        }
      } catch (error) {
        logger.error(
          `Failed to load value for key ${key}`,
          error instanceof Error ? error : new Error(String(error))
        )
        if (!cancelled) {
          setValueState(defaultValueRef.current)
          setIsLoading(false)
          isInitializedRef.current = true
        }
      }
    }

    if (!isInitializedRef.current) {
      void loadValue()
    }

    return () => {
      cancelled = true
    }
  }, [key])

  // Set value function
  const setValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      try {
        // Compute new value synchronously first
        const computedValue =
          typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue

        // Update state immediately
        setValueState(computedValue)

        // Await persistence to ensure write succeeds
        // For critical keys like is-authenticated, this ensures state consistency
        await storage.set(key, computedValue)
      } catch (error) {
        logger.error(
          `Failed to set value for key ${key}`,
          error instanceof Error ? error : new Error(String(error))
        )

        // Revert on error by loading current value from storage
        try {
          const current = await storage.get<T>(key)
          setValueState(
            current !== null && current !== undefined ? current : defaultValueRef.current
          )
        } catch (revertError) {
          logger.error(
            `Failed to revert value for key ${key}`,
            revertError instanceof Error ? revertError : new Error(String(revertError))
          )
        }

        // Re-throw error so caller can handle it
        throw error
      }
    },
    [key, value]
  )

  // Delete value function
  const deleteValue = useCallback(async () => {
    try {
      setValueState(defaultValueRef.current)
      await storage.delete(key)
    } catch (error) {
      logger.error(
        `Failed to delete value for key ${key}`,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }, [key])

  // Return current value (or defaultValue if still loading)
  const currentValue = isLoading ? defaultValueRef.current : value

  return [currentValue, setValue, deleteValue]
}

export function useStorageOnce<T>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      const stored = storage.get<T>(key)
      if (stored !== null && stored !== undefined) {
        setValue(stored)
      }
    }
  }, [key])

  return value
}

/**
 * Alias for useStorage for backwards compatibility
 * @deprecated Use useStorage instead
 */
export const useKV = useStorage
