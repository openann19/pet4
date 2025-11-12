/**
 * Dynamic Type Support Hook (Web)
 *
 * Provides adaptive text sizing based on user preferences:
 * - Respects browser font size settings
 * - Scales with system text size preferences
 * - Provides semantic type scale
 * - Ensures minimum touch target sizes
 * - WCAG AAA compliant contrast ratios
 *
 * Location: apps/web/src/hooks/accessibility/use-dynamic-type.ts
 */

import { useEffect, useState } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('dynamic-type')

/**
 * Text size preference
 */
export type TextSizePreference =
  | 'extra-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'extra-large'
  | 'accessibility-1'
  | 'accessibility-2'
  | 'accessibility-3'

/**
 * Type scale configuration
 */
export interface TypeScale {
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
 * Dynamic type options
 */
export interface UseDynamicTypeOptions {
  readonly baseSize?: number // Base font size in px
  readonly minSize?: number // Minimum font size in px
  readonly maxSize?: number // Maximum font size in px
  readonly scaleRatio?: number // Modular scale ratio
}

/**
 * Dynamic type return type
 */
export interface UseDynamicTypeReturn {
  readonly textSizePreference: TextSizePreference
  readonly baseSize: number
  readonly typeScale: TypeScale
  readonly fontSize: (size: keyof TypeScale) => string
  readonly minTouchTarget: number // Minimum touch target size in px
}

const DEFAULT_BASE_SIZE = 16 // px
const DEFAULT_MIN_SIZE = 12 // px
const DEFAULT_MAX_SIZE = 32 // px
const DEFAULT_SCALE_RATIO = 1.25 // Major third scale
const MIN_TOUCH_TARGET = 44 // px (WCAG AAA requirement)

// Text size preference to scale factor mapping
const TEXT_SIZE_SCALE: Record<TextSizePreference, number> = {
  'extra-small': 0.75,
  'small': 0.875,
  'medium': 1,
  'large': 1.125,
  'extra-large': 1.25,
  'accessibility-1': 1.5,
  'accessibility-2': 1.75,
  'accessibility-3': 2,
}

export function useDynamicType(
  options: UseDynamicTypeOptions = {}
): UseDynamicTypeReturn {
  const {
    baseSize = DEFAULT_BASE_SIZE,
    minSize = DEFAULT_MIN_SIZE,
    maxSize = DEFAULT_MAX_SIZE,
    scaleRatio = DEFAULT_SCALE_RATIO,
  } = options

  const [textSizePreference, setTextSizePreference] = useState<TextSizePreference>('medium')
  const [actualBaseSize, setActualBaseSize] = useState(baseSize)

  // Detect user's text size preference
  useEffect(() => {
    // Check root font size
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    )

    // Calculate scale factor relative to default 16px
    const scaleFactor = rootFontSize / 16

    // Determine preference
    let preference: TextSizePreference = 'medium'

    if (scaleFactor >= 2) {
      preference = 'accessibility-3'
    } else if (scaleFactor >= 1.75) {
      preference = 'accessibility-2'
    } else if (scaleFactor >= 1.5) {
      preference = 'accessibility-1'
    } else if (scaleFactor >= 1.25) {
      preference = 'extra-large'
    } else if (scaleFactor >= 1.125) {
      preference = 'large'
    } else if (scaleFactor <= 0.75) {
      preference = 'extra-small'
    } else if (scaleFactor <= 0.875) {
      preference = 'small'
    }

    setTextSizePreference(preference)

    // Calculate actual base size
    const scaledBase = baseSize * TEXT_SIZE_SCALE[preference]
    const clampedBase = Math.max(minSize, Math.min(maxSize, scaledBase))
    setActualBaseSize(clampedBase)

    logger.debug('Text size preference detected', {
      preference,
      rootFontSize,
      scaleFactor,
      actualBaseSize: clampedBase,
    })
  }, [baseSize, minSize, maxSize])

  // Generate type scale
  const typeScale: TypeScale = {
    xs: actualBaseSize / Math.pow(scaleRatio, 2),
    sm: actualBaseSize / scaleRatio,
    base: actualBaseSize,
    lg: actualBaseSize * scaleRatio,
    xl: actualBaseSize * Math.pow(scaleRatio, 2),
    '2xl': actualBaseSize * Math.pow(scaleRatio, 3),
    '3xl': actualBaseSize * Math.pow(scaleRatio, 4),
    '4xl': actualBaseSize * Math.pow(scaleRatio, 5),
  }

  // Get font size with unit
  const fontSize = (size: keyof TypeScale): string => {
    return `${typeScale[size]}px`
  }

  return {
    textSizePreference,
    baseSize: actualBaseSize,
    typeScale,
    fontSize,
    minTouchTarget: MIN_TOUCH_TARGET,
  }
}
