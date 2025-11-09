/**
 * Camera Permissions (Mobile)
 *
 * Handles camera permissions for iOS and Android.
 *
 * NOTE: In expo-camera SDK 51+, the permission API changed to use hooks.
 * This file provides deprecated utility functions for backward compatibility.
 * For direct usage in components, use useCameraPermissions() hook directly.
 *
 * Location: apps/mobile/src/lib/camera-permissions.ts
 *
 * @deprecated Use useCameraPermissions() hook directly in components.
 */

import { Alert, Linking, Platform } from 'react-native'
import { createLogger } from '../utils/logger'

const logger = createLogger('camera-permissions')

/**
 * Request camera permissions
 *
 * NOTE: In expo-camera SDK 51+, the permission API changed to use hooks.
 * This function is deprecated. Use useCameraPermissions() hook in components instead.
 *
 * @deprecated Use useCameraPermissions() hook directly in components.
 */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    // expo-camera SDK 51+ uses useCameraPermissions() hook
    // This function cannot use hooks, so we return false and log a warning
    logger.warn(
      'requestCameraPermissions() is deprecated in expo-camera SDK 51+. Use useCameraPermissions() hook in components instead.'
    )

    // Show alert to guide users to enable permissions in settings
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera permissions in your device settings to take photos and videos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:')
            } else {
              Linking.openSettings()
            }
          },
        },
      ]
    )
    return false
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to request camera permissions', err)
    return false
  }
}

/**
 * Check camera permissions
 *
 * NOTE: In expo-camera SDK 51+, the permission API changed to use hooks.
 * This function is deprecated. Use useCameraPermissions() hook in components instead.
 *
 * @deprecated Use useCameraPermissions() hook directly in components.
 */
export async function checkCameraPermissions(): Promise<boolean> {
  try {
    // expo-camera SDK 51+ uses useCameraPermissions() hook
    // This function cannot use hooks, so we return false and log a warning
    logger.warn(
      'checkCameraPermissions() is deprecated in expo-camera SDK 51+. Use useCameraPermissions() hook in components instead.'
    )
    return false
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to check camera permissions', err)
    return false
  }
}
