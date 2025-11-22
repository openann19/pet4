// Logger available in apps but not in packages
const logger = {
  warn: (message: string, ...args: any[]) => console.warn(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

/**
 * Cross-platform haptic feedback utilities
 * Safely handles Expo Haptics with availability checks for iOS/Android
 */

let Haptics: any | undefined
let isHapticsAvailable = false

// Lazy load Expo Haptics to avoid import issues on web
try {
  // This will only work on native platforms
  Haptics = require('expo-haptics')
  isHapticsAvailable = true
} catch {
  // Haptics not available (web platform)
  isHapticsAvailable = false
}

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'

export type HapticPattern = number[]

/**
 * Trigger haptic feedback with availability check
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!isHapticsAvailable || !Haptics) return

  try {
    switch (style) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        break
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        break
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        break
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        break
      case 'selection':
        Haptics.selectionAsync()
        break
    }
  } catch (error) {
    // Silently fail if haptics are not available or fail
    logger.warn('Haptic feedback failed:', error)
  }
}

/**
 * Trigger custom haptic pattern
 */
export function triggerHapticPattern(pattern: HapticPattern): void {
  if (!isHapticsAvailable || !Haptics) return

  // For now, just trigger a simple impact
  // More complex patterns would require additional implementation
  triggerHaptic('medium')
}

/**
 * Check if haptic feedback is available
 */
export function getHapticsAvailable(): boolean {
  return isHapticsAvailable
}

/**
 * Safe haptic trigger that won't throw on web
 */
export const haptic = {
  light: () => { triggerHaptic('light'); },
  medium: () => { triggerHaptic('medium'); },
  heavy: () => { triggerHaptic('heavy'); },
  success: () => { triggerHaptic('success'); },
  warning: () => { triggerHaptic('warning'); },
  error: () => { triggerHaptic('error'); },
  selection: () => { triggerHaptic('selection'); },
  pattern: triggerHapticPattern,
  available: getHapticsAvailable,
}
