/**
 * Accessibility utilities for React Native
 * Ensures WCAG 2.1 AA compliance and proper a11y support
 * Location: src/utils/accessibility.ts
 */

import type { AccessibilityProps } from 'react-native'
import { Platform } from 'react-native'
import { createLogger } from './logger'

const logger = createLogger('accessibility')

export const MIN_TOUCH_TARGET_SIZE = 44 // iOS/Android minimum touch target

export interface AccessibilityConfig {
  role?: AccessibilityProps['accessibilityRole']
  label: string
  hint?: string
  state?: AccessibilityProps['accessibilityState']
  value?: string
  liveRegion?: 'none' | 'polite' | 'assertive'
}

/**
 * Get accessibility props for an interactive element
 */
export function getAccessibilityProps(config: AccessibilityConfig): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: config.role ?? 'button',
    accessibilityLabel: config.label,
    accessibilityHint: config.hint,
    accessibilityState: config.state,
    accessibilityValue: config.value ? { text: config.value } : undefined,
    accessibilityLiveRegion: config.liveRegion,
  }
}

/**
 * Get minimum touch target size based on platform
 */
export function getMinTouchTargetSize(): number {
  return MIN_TOUCH_TARGET_SIZE
}

/**
 * Ensure element meets minimum touch target requirements
 */
export function ensureTouchTarget(size: number): { minWidth: number; minHeight: number } {
  const minSize = getMinTouchTargetSize()
  return {
    minWidth: Math.max(size, minSize),
    minHeight: Math.max(size, minSize),
  }
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (Platform.OS === 'ios') {
    // iOS automatically respects prefers-reduced-motion in animations
    return false
  }
  if (Platform.OS === 'android') {
    // Android: Check system setting
    // This requires native module or user preference
    return false
  }
  return false
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(baseDuration: number): number {
  return prefersReducedMotion() ? 0 : baseDuration
}

/**
 * Accessibility roles for common UI elements
 */
export const AccessibilityRoles = {
  button: 'button' as const,
  link: 'link' as const,
  image: 'image' as const,
  text: 'text' as const,
  header: 'header' as const,
  searchbox: 'searchbox' as const,
  switch: 'switch' as const,
  tab: 'tab' as const,
  adjust: 'adjustable' as const,
  none: 'none' as const,
} as const

/**
 * Create accessibility label with context
 */
export function createAccessibilityLabel(
  action: string,
  context?: string,
  target?: string
): string {
  const parts: string[] = []

  if (action) {
    parts.push(action)
  }

  if (target) {
    parts.push(target)
  }

  if (context) {
    parts.push(`(${context})`)
  }

  return parts.join(' ')
}

/**
 * Format accessibility value for progress/status
 */
export function formatAccessibilityValue(current: number, max: number, unit?: string): string {
  const percentage = Math.round((current / max) * 100)
  if (unit) {
    return `${current} ${unit} of ${max} ${unit}, ${percentage}%`
  }
  return `${current} of ${max}, ${percentage}%`
}

/**
 * Screen reader announcement helper
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // This would typically use a native module or accessibility service
  // For now, we ensure proper accessibilityLabel is set
  if (__DEV__) {
    logger.debug('Screen reader announcement', { message, priority })
  }
}
