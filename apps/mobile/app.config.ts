import type { ExpoConfig, ConfigContext } from 'expo/config'

const projectName = 'PetSpark Mobile'
const projectSlug = 'petspark-mobile'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: projectName,
  slug: projectSlug,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  jsEngine: 'hermes',
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  updates: {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pawfectmatch.app',
    infoPlist: {
      NSCameraUsageDescription: 'We use the camera so you can verify your identity and pets.',
      NSPhotoLibraryAddUsageDescription: 'Allow PetSpark to save photos that are used for verification.'
    }
  },
  android: {
    package: 'com.pawfectmatch',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff'
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.ACCESS_NETWORK_STATE'
    ],
    blockedPermissions: [],
    softwareKeyboardLayoutMode: 'pan'
  },
  extra: {
    eas: {
      projectId: '00000000-0000-0000-0000-000000000000'
    }
  }
})
