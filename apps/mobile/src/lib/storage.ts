import { MMKV } from 'react-native-mmkv'

export const mmkv = new MMKV({
  id: 'petspark-storage',
  encryptionKey: 'default-key',
})

export const storage = {
  get<T>(key: string): T | null {
    const v = mmkv.getString(key)
    return v ? (JSON.parse(v) as T) : null
  },
  set<T>(key: string, value: T): void {
    mmkv.set(key, JSON.stringify(value))
  },
  delete(key: string): void {
    mmkv.delete(key)
  },
}
