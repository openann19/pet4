/**
 * Type declarations for expo-document-picker
 */

declare module 'expo-document-picker' {
  export interface DocumentPickerOptions {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }

  export interface DocumentPickerAsset {
    uri: string;
    name?: string;
    size?: number;
    mimeType?: string;
    file?: File;
  }

  export interface DocumentPickerResult {
    canceled: boolean;
    assets?: DocumentPickerAsset[];
  }

  export function getDocumentAsync(
    options?: DocumentPickerOptions
  ): Promise<DocumentPickerResult>;
  
  export function pickDirectory(): Promise<{ uri: string } | null>;
}

