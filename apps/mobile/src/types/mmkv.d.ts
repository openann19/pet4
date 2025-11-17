/**
 * MMKV Type Definitions
 *
 * Type definitions for react-native-mmkv optional dependency
 */

export interface MMKVInstance {
  set: (key: string, value: string) => void
  getString: (key: string) => string | undefined
  delete: (key: string) => void
  clearAll: () => void
  contains: (key: string) => boolean
  getAllKeys: () => string[]
}

export interface MMKVConstructor {
  new (config: { id: string; encryptionKey: string }): MMKVInstance
}

export interface MMKVModule {
  MMKV?: MMKVConstructor
  default?: MMKVConstructor
}
