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
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pawfectmatch.app',
    infoPlist: {
      NSCameraUsageDescription: 'We use the camera so you can verify your identity and pets.',
      NSPhotoLibraryAddUsageDescription: 'Allow PetSpark to save photos that are used for verification.',
      NSPhotoLibraryUsageDescription: 'Allow PetSpark to access your photos to share pet profiles.',
      NSLocationWhenInUseUsageDescription: 'PetSpark uses your location to help you find pets nearby and connect with local pet owners.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'PetSpark uses your location to help you find pets nearby and connect with local pet owners.',
      NSMicrophoneUsageDescription: 'PetSpark uses the microphone for video calls and voice messages.',
      NSUserTrackingUsageDescription: 'PetSpark uses tracking to provide personalized content and improve your experience.'
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1']
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1']
        }
      ]
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
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ],
    blockedPermissions: [],
    softwareKeyboardLayoutMode: 'pan',
    intentFilters: []
  },
  extra: {
    eas: {
      projectId: '00000000-0000-0000-0000-000000000000'
    }
  }
})
