import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@petspark/shared';

export const asyncStorage: StorageAdapter = {
  async getItem(k: string): Promise<string | null> {
    return await AsyncStorage.getItem(k);
  },
  async setItem(k: string, v: string): Promise<void> {
    await AsyncStorage.setItem(k, v);
  },
  async removeItem(k: string): Promise<void> {
    await AsyncStorage.removeItem(k);
  },
};

