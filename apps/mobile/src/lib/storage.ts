import AsyncStorage from '@react-native-async-storage/async-storage'
import logger from '@/core/logger';

/**
 * Storage abstraction layer for mobile
 * Provides consistent interface for storing/retrieving data
 */
export const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      logger.error(`Failed to get item from storage: ${String(key ?? '')}`, error)
      return null
    }
  },

  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      logger.error(`Failed to set item in storage: ${String(key ?? '')}`, error)
    }
  },

  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      logger.error(`Failed to remove item from storage: ${String(key ?? '')}`, error)
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.clear()
    } catch (error) {
      logger.error('Failed to clear storage', error)
    }
  },
}
