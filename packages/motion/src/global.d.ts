declare module 'expo-haptics'
declare module 'react-native-gesture-handler'
declare module 'react-native-reanimated' {
  // Re-export to avoid TS errors in environments without types for some reanimated helpers used in tests
  export * from 'react-native-reanimated'
}
