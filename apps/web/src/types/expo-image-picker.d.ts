/**
 * Type declarations for expo-image-picker
 * Used for web compatibility when module is not available
 */

declare module 'expo-image-picker' {
  export interface ImagePickerOptions {
    mediaTypes?: 'images' | 'videos' | 'all'
    allowsEditing?: boolean
    aspect?: [number, number]
    quality?: number
    allowsMultipleSelection?: boolean
    base64?: boolean
    exif?: boolean
  }

  export interface ImagePickerResult {
    cancelled: boolean
    uri?: string
    width?: number
    height?: number
    type?: string
    base64?: string
    exif?: Record<string, unknown>
    assets?: Array<{
      uri: string
      width: number
      height: number
      type?: string
      base64?: string
      exif?: Record<string, unknown>
    }>
  }

  export interface PermissionResponse {
    status: 'granted' | 'denied' | 'undetermined'
    granted: boolean
    expires: 'never' | number
    canAskAgain: boolean
  }

  export async function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>
  export async function requestCameraPermissionsAsync(): Promise<PermissionResponse>
  export async function getMediaLibraryPermissionsAsync(): Promise<PermissionResponse>
  export async function getCameraPermissionsAsync(): Promise<PermissionResponse>

  export async function launchImageLibraryAsync(
    options?: ImagePickerOptions
  ): Promise<ImagePickerResult>

  export async function launchCameraAsync(
    options?: ImagePickerOptions
  ): Promise<ImagePickerResult>

  export const MediaTypeOptions: {
    Images: 'images'
    Videos: 'videos'
    All: 'all'
  }
}

