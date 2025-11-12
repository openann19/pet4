/**
 * Type declarations for expo-file-system
 * Used for web compatibility when module is not available
 */

declare module 'expo-file-system' {
  export interface FileSystem {
    documentDirectory: string | null;
    cacheDirectory: string | null;
    bundleDirectory: string | null;
    temporaryDirectory: string | null;
  }

  export const FileSystem: FileSystem;

  export interface DownloadOptions {
    uri: string;
    fileUri: string;
    headers?: Record<string, string>;
  }

  export interface DownloadResult {
    uri: string;
    status: number;
    headers: Record<string, string>;
    mimeType?: string | null;
  }

  export function downloadAsync(
    uri: string,
    fileUri: string,
    options?: Partial<DownloadOptions>
  ): Promise<DownloadResult>;

  export function getInfoAsync(
    fileUri: string,
    options?: { md5?: boolean; size?: boolean }
  ): Promise<{
    exists: boolean;
    isDirectory?: boolean;
    modificationTime?: number;
    size?: number;
    uri: string;
    md5?: string;
  }>;

  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: 'utf8' | 'base64' }
  ): Promise<string>;

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: 'utf8' | 'base64' }
  ): Promise<void>;

  export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;

  export function makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean }
  ): Promise<void>;

  export function readDirectoryAsync(fileUri: string): Promise<string[]>;

  export function copyAsync(options: { from: string; to: string }): Promise<void>;

  export function moveAsync(options: { from: string; to: string }): Promise<void>;
}
