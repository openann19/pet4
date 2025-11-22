/**
 * Type declarations for optional dependencies
 * These modules may not be installed, so we declare them as optional
 */

// Optional react-native-mmkv module
declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(config: { id: string; encryptionKey: string })
    set(key: string, value: string): void
    getString(key: string): string | undefined
    delete(key: string): void
    clearAll(): void
    contains(key: string): boolean
    getAllKeys(): string[]
  }
}

// Optional upload-queue module (may not exist)
declare module '../lib/upload-queue' {
  export function flushPendingUploads(): Promise<boolean>
}
