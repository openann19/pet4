/**
 * Dynamic Type Support (Mobile)
 *
 * Provides dynamic type scaling based on system font size settings.
 * Features:
 * - Support system font size settings (iOS/Android)
 * - Dynamic layout adjustments based on text size
 * - Text truncation handling for large text sizes
 * - Readable line heights that scale properly
 * - Support up to 200% text scaling
 * - Layout reflow for accessibility
 *
 * Location: apps/mobile/src/utils/dynamic-type.ts
 */

import { PixelRatio, Platform } from 'react-native'
import { createLogger } from './logger'

const logger = createLogger('dynamic-type')

/**
 * Text size category
 */
export type TextSizeCategory =
  | 'extra-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'extra-large'
  | 'accessibility-1'
  | 'accessibility-2'
  | 'accessibility-3'
  | 'accessibility-4'
  | 'accessibility-5'

/**
 * Dynamic type configuration
 */
export interface DynamicTypeConfig {
  readonly baseFontSize?: number
  readonly minFontSize?: number
  readonly maxFontSize?: number
  readonly scaleFactor?: number
  readonly lineHeightMultiplier?: number
  readonly enableLayoutReflow?: boolean
}

/**
 * Dynamic type scale
 */
export interface DynamicTypeScale {
  readonly xs: number
  readonly sm: number
  readonly base: number
  readonly lg: number
  readonly xl: number
  readonly '2xl': number
  readonly '3xl': number
  readonly '4xl': number
}

/**
 * Dynamic type result
 */
export interface DynamicTypeResult {
  readonly category: TextSizeCategory
  readonly scaleFactor: number
  readonly baseSize: number
  readonly typeScale: DynamicTypeScale
  readonly lineHeight: (fontSize: number) => number
  readonly fontSize: (size: keyof DynamicTypeScale) => number
  readonly minTouchTarget: number
}

const DEFAULT_BASE_FONT_SIZE = 16
const DEFAULT_MIN_FONT_SIZE = 12
const DEFAULT_MAX_FONT_SIZE = 32
const DEFAULT_SCALE_FACTOR = 1.25
const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.5
const MIN_TOUCH_TARGET = 44 // WCAG AAA requirement (44x44pt)

/**
 * Get system font scale factor (iOS)
 */
function getIOSFontScale(): number {
  if (Platform.OS !== 'ios') {
    return 1
  }

  // On iOS, the font scale is typically 1.0 (default) to 1.47 (largest accessibility)
  // We can get this from PixelRatio.getFontScale() or use AccessibilityInfo
  const fontScale = PixelRatio.getFontScale()
  return Math.max(1, Math.min(fontScale, 2)) // Clamp between 1x and 2x (200%)
}

/**
 * Get system font scale factor (Android)
 */
function getAndroidFontScale(): number {
  if (Platform.OS !== 'android') {
    return 1
  }

  // On Android, font scale can be obtained from system settings
  // PixelRatio.getFontScale() returns the font scale on Android
  const fontScale = PixelRatio.getFontScale()
  return Math.max(0.85, Math.min(fontScale, 2)) // Clamp between 0.85x and 2x (200%)
}

/**
 * Get system font scale factor
 */
export function getSystemFontScale(): number {
  if (Platform.OS === 'ios') {
    return getIOSFontScale()
  } else if (Platform.OS === 'android') {
    return getAndroidFontScale()
  }
  return 1
}

/**
 * Get text size category from scale factor
 */
export function getTextSizeCategory(scaleFactor: number): TextSizeCategory {
  if (scaleFactor >= 1.94) {
    return 'accessibility-5'
  } else if (scaleFactor >= 1.76) {
    return 'accessibility-4'
  } else if (scaleFactor >= 1.59) {
    return 'accessibility-3'
  } else if (scaleFactor >= 1.41) {
    return 'accessibility-2'
  } else if (scaleFactor >= 1.24) {
    return 'accessibility-1'
  } else if (scaleFactor >= 1.12) {
    return 'extra-large'
  } else if (scaleFactor >= 1.06) {
    return 'large'
  } else if (scaleFactor >= 0.94) {
    return 'medium'
  } else if (scaleFactor >= 0.88) {
    return 'small'
  } else {
    return 'extra-small'
  }
}

/**
 * Calculate dynamic type scale
 */
export function calculateDynamicTypeScale(
  config: DynamicTypeConfig = {}
): DynamicTypeResult {
  const {
    baseFontSize = DEFAULT_BASE_FONT_SIZE,
    minFontSize = DEFAULT_MIN_FONT_SIZE,
    maxFontSize = DEFAULT_MAX_FONT_SIZE,
    scaleFactor = DEFAULT_SCALE_FACTOR,
    lineHeightMultiplier = DEFAULT_LINE_HEIGHT_MULTIPLIER,
  } = config

  // Get system font scale
  const systemScale = getSystemFontScale()
  const category = getTextSizeCategory(systemScale)

  // Calculate base size with system scale
  const scaledBaseSize = baseFontSize * systemScale
  const clampedBaseSize = Math.max(minFontSize, Math.min(maxFontSize, scaledBaseSize))

  // Generate type scale
  const typeScale: DynamicTypeScale = {
    xs: Math.max(minFontSize, clampedBaseSize / Math.pow(scaleFactor, 2)),
    sm: Math.max(minFontSize, clampedBaseSize / scaleFactor),
    base: clampedBaseSize,
    lg: Math.min(maxFontSize, clampedBaseSize * scaleFactor),
    xl: Math.min(maxFontSize, clampedBaseSize * Math.pow(scaleFactor, 2)),
    '2xl': Math.min(maxFontSize, clampedBaseSize * Math.pow(scaleFactor, 3)),
    '3xl': Math.min(maxFontSize, clampedBaseSize * Math.pow(scaleFactor, 4)),
    '4xl': Math.min(maxFontSize, clampedBaseSize * Math.pow(scaleFactor, 5)),
  }

  // Line height calculator
  const lineHeight = (fontSize: number): number => {
    return Math.round(fontSize * lineHeightMultiplier)
  }

  // Font size getter
  const fontSize = (size: keyof DynamicTypeScale): number => {
    return typeScale[size]
  }

  logger.debug('Dynamic type scale calculated', {
    category,
    systemScale,
    clampedBaseSize,
    typeScale,
  })

  return {
    category,
    scaleFactor: systemScale,
    baseSize: clampedBaseSize,
    typeScale,
    lineHeight,
    fontSize,
    minTouchTarget: MIN_TOUCH_TARGET,
  }
}

/**
 * Get readable line height for a given font size
 */
export function getReadableLineHeight(fontSize: number, multiplier = 1.5): number {
  return Math.round(fontSize * multiplier)
}

/**
 * Calculate minimum touch target size based on text size
 */
export function getMinTouchTarget(textSize: number): number {
  // Ensure touch target is at least 44x44pt, or 1.5x the text size, whichever is larger
  return Math.max(MIN_TOUCH_TARGET, Math.round(textSize * 1.5))
}

/**
 * Check if text should be truncated based on size
 */
export function shouldTruncateText(
  text: string,
  fontSize: number,
  maxWidth: number
): boolean {
  // Estimate character width (approximate: fontSize * 0.6 for average character)
  const avgCharWidth = fontSize * 0.6
  const estimatedWidth = text.length * avgCharWidth
  return estimatedWidth > maxWidth
}

/**
 * Get scaled dimensions for layout
 */
export function getScaledDimensions(
  baseWidth: number,
  baseHeight: number,
  scaleFactor: number
): { width: number; height: number } {
  return {
    width: Math.round(baseWidth * scaleFactor),
    height: Math.round(baseHeight * scaleFactor),
  }
}

/**
 * Get scaled spacing
 */
export function getScaledSpacing(baseSpacing: number, scaleFactor: number): number {
  return Math.round(baseSpacing * scaleFactor)
}

/**
 * Check if layout reflow is needed
 */
export function needsLayoutReflow(scaleFactor: number): boolean {
  // Layout reflow is typically needed when scale factor exceeds 1.5x (150%)
  return scaleFactor >= 1.5
}
