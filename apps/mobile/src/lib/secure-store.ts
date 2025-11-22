// Small, typed wrapper so the rest of the app doesn’t depend on a specific lib.
export interface SecureKV {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  del(key: string): Promise<void>
}

let provider: SecureKV | null = null

export function setSecureProvider(p: SecureKV) {
  provider = p
}

export const secureStore: SecureKV = {
  async get(k) {
    if (!provider) throw new Error('Secure provider not configured')
    return provider.get(k)
  },
  async set(k, v) {
    if (!provider) throw new Error('Secure provider not configured')
    return provider.set(k, v)
  },
  async del(k) {
    if (!provider) throw new Error('Secure provider not configured')
    return provider.del(k)
  },
}

// Example adapters:
//
// import * as ExpoSecureStore from 'expo-secure-store'
// setSecureProvider({
//   async get(k){ return (await ExpoSecureStore.getItemAsync(k)) ?? null },
//   async set(k,v){ await ExpoSecureStore.setItemAsync(k,v) },
//   async del(k){ await ExpoSecureStore.deleteItemAsync(k) },
// })
//
// import EncryptedStorage from 'react-native-encrypted-storage'
// setSecureProvider({
//   async get(k){ return (await EncryptedStorage.getItem(k)) },
//   async set(k,v){ await EncryptedStorage.setItem(k,v) },
//   async del(k){ await EncryptedStorage.removeItem(k) },
// })
