import type { ExpoConfig, ConfigContext } from 'expo/config'

const projectName = 'PetSpark Mobile'
const projectSlug = 'petspark-mobile'

const env = process.env ?? {}

const resolve = (key: string, fallback: string): string => {
  const value = env[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

const iosBundleIdentifier = resolve('EXPO_IOS_BUNDLE_IDENTIFIER', 'app.petspark.mobile')
const androidPackageName = resolve('EXPO_ANDROID_PACKAGE', 'app.petspark.mobile')
const easProjectId = resolve('EAS_PROJECT_ID', 'd6a2c5f1-4b3e-43d6-9fe9-f3eec1d932be')

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
    policy: 'sdkVersion',
  },
  updates: {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  plugins: ['react-native-mmkv-expo'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.petspark.mobile',
    infoPlist: {
      NSCameraUsageDescription: 'We use the camera so you can verify your identity and pets.',
      NSPhotoLibraryAddUsageDescription:
        'Allow PetSpark to save photos that are used for verification.',
      NSPhotoLibraryUsageDescription: 'Allow PetSpark to access your photos to share pet profiles.',
      NSLocationWhenInUseUsageDescription:
        'PetSpark uses your location to help you find pets nearby and connect with local pet owners.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'PetSpark uses your location to help you find pets nearby and connect with local pet owners.',
      NSMicrophoneUsageDescription:
        'PetSpark uses the microphone for video calls and voice messages.',
      NSUserTrackingUsageDescription:
        'PetSpark uses tracking to provide personalized content and improve your experience.',
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
      ],
    },
  },
  android: {
    package: 'com.petspark.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    blockedPermissions: [],
    softwareKeyboardLayoutMode: 'pan',
    intentFilters: [],
  },
  extra: {
    apiUrl: process.env['EXPO_PUBLIC_API_URL'], // used by api-client
    eas: {
      // Configuration: Replace with actual EAS Project ID from expo.dev
      // This should be set in environment variables for production
      // Get from: eas project:info or expo.dev dashboard
      // Store in CI secrets vault, never commit to git
      projectId:
        process.env['EXPO_PUBLIC_EAS_PROJECT_ID'] ?? '00000000-0000-0000-0000-000000000000',
    },
  },
})
