import { Platform } from 'react-native'

export function useRipple() {
  // For RN Android, rely on Pressable android_ripple prop in the consumer.
  // For web, consumer applies CSS mask or pseudo-element; this hook is a no-op.
  return {
    androidRipple:
      Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.2)', borderless: false } : undefined,
  }
}
