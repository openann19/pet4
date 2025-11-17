/**
 * Simple storage hook for chat-core package
 * Uses localStorage on web, can be overridden in native environments
 */

import { useState, useEffect, useCallback, useRef } from 'react'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  const storage = getStorage()
  if (!storage) {
    return defaultValue
  }
  try {
    const item = storage.getItem(key)
    if (item === null) {
      return defaultValue
    }
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage might be full or disabled
  }
}

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
  const [value, setValueState] = useState<T>(() => getItem(key, defaultValue))
  const keyRef = useRef(key)
  const defaultValueRef = useRef(defaultValue)

  // Update key ref if it changes
  if (keyRef.current !== key) {
    keyRef.current = key
    setValueState(getItem(key, defaultValue))
  }

  // Update default value ref
  defaultValueRef.current = defaultValue

  // Sync with storage on mount and when key changes
  useEffect(() => {
    const storedValue = getItem(keyRef.current, defaultValueRef.current)
    setValueState(storedValue)
  }, [key])

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueState(prev => {
      const nextValue =
        typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue
      setItem(keyRef.current, nextValue)
      return nextValue
    })
  }, [])

  const deleteValue = useCallback(() => {
    const storage = getStorage()
    if (storage) {
      try {
        storage.removeItem(keyRef.current)
      } catch {
        // Ignore errors
      }
    }
    setValueState(defaultValueRef.current)
  }, [])

  return [value, setValue, deleteValue]
}
