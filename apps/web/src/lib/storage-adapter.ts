import { set, get, del } from 'idb-keyval';
import type { StorageAdapter } from '@petspark/shared';

export const idbStorage: StorageAdapter = {
  async getItem(k: string): Promise<string | null> {
    const value = (await get(k)) as unknown;
    if (typeof value === 'string') {
      return value;
    }
    if (value == null) {
      return null;
    }
    throw new TypeError(`Expected string value for key "${k}", received ${typeof value}`);
  },
  async setItem(k: string, v: string): Promise<void> {
    await set(k, v);
  },
  async removeItem(k: string): Promise<void> {
    await del(k);
  },
};
