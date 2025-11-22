/**
 * Type declarations for expo-document-picker
 * Used for web compatibility when module is not available
 */

declare module 'expo-document-picker' {
  export interface DocumentPickerOptions {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }

  export interface DocumentPickerResult {
    type: 'success' | 'cancel';
    uri?: string;
    name?: string;
    mimeType?: string;
    size?: number;
    file?: File;
    output?: File[] | null;
  }

  export interface PermissionResponse {
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
    expires: 'never' | number;
    canAskAgain: boolean;
  }

  export async function getDocumentAsync(
    options?: DocumentPickerOptions
  ): Promise<DocumentPickerResult>;

  export async function requestPermissionsAsync(): Promise<PermissionResponse>;
  export async function getPermissionsAsync(): Promise<PermissionResponse>;
}
