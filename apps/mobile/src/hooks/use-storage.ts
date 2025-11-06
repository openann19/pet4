/**
 * useStorage Hook for Mobile
 * 
 * React hook replacement for useKV from @github/spark/hooks
 * Provides reactive storage state management using AsyncStorage.
 * Matches the web API signature: [value, setValue, deleteValue]
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createLogger } from '../utils/logger'

const logger = createLogger('useStorage')

/**
 * Hook to access and manage storage values
 * 
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue, deleteValue] tuple
 */
export function useStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => Promise<void>, () => Promise<void>] {
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

    const loadValue = async () => {
      try {
        const stored = await AsyncStorage.getItem(key)
        
        if (!cancelled) {
          if (stored !== null) {
            try {
              const parsed = JSON.parse(stored) as T
              setValueState(parsed)
            } catch {
              // If parsing fails, use default value
              setValueState(defaultValueRef.current)
            }
          } else {
            setValueState(defaultValueRef.current)
          }
          setIsLoading(false)
          isInitializedRef.current = true
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error(`Failed to load value for key ${key}`, err)
        if (!cancelled) {
          setValueState(defaultValueRef.current)
          setIsLoading(false)
          isInitializedRef.current = true
        }
      }
    }

    if (!isInitializedRef.current) {
      loadValue()
    }

    return () => {
      cancelled = true
    }
  }, [key])

  // Set value function
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    try {
      // Use functional update to get current state, avoiding stale closures
      let computedValue: T
      setValueState((currentState) => {
        // Compute new value using current state
        computedValue = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(currentState)
          : newValue

        return computedValue
      })

      // Await persistence to ensure write succeeds
      await AsyncStorage.setItem(key, JSON.stringify(computedValue!))
      
      // Update state after successful persistence
      setValueState(computedValue!)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`Failed to set value for key ${key}`, err)
      
      // Revert on error by loading current value from storage
      try {
        const current = await AsyncStorage.getItem(key)
        if (current !== null) {
          try {
            const parsed = JSON.parse(current) as T
            setValueState(parsed)
          } catch {
            setValueState(defaultValueRef.current)
          }
        } else {
          setValueState(defaultValueRef.current)
        }
      } catch (revertError) {
        const revertErr = revertError instanceof Error ? revertError : new Error(String(revertError))
        logger.error(`Failed to revert value for key ${key}`, revertErr)
      }
      
      // Re-throw error so caller can handle it
      throw error
    }
  }, [key])

  // Delete value function
  const deleteValue = useCallback(async () => {
    try {
      setValueState(defaultValueRef.current)
      await AsyncStorage.removeItem(key)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`Failed to delete value for key ${key}`, err)
    }
  }, [key])

  // Return current value (or defaultValue if still loading)
  const currentValue = isLoading ? defaultValueRef.current : value

  return [currentValue, setValue, deleteValue]
}

