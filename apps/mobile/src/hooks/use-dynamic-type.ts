/**
 * Dynamic Type Hook (Mobile)
 *
 * React hook for dynamic type scaling based on system font size settings.
 * Provides reactive updates when system font size changes.
 *
 * Location: apps/mobile/src/hooks/use-dynamic-type.ts
 */

import { useState, useEffect, useCallback } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  calculateDynamicTypeScale,
  getSystemFontScale,
  getTextSizeCategory,
  type DynamicTypeConfig,
  type DynamicTypeResult,
  type TextSizeCategory,
} from '../utils/dynamic-type'
import { createLogger } from '../utils/logger'

const logger = createLogger('use-dynamic-type')

/**
 * Dynamic type hook options
 */
export interface UseDynamicTypeOptions extends DynamicTypeConfig {
  readonly updateOnChange?: boolean
}

/**
 * Dynamic type hook return type
 */
export interface UseDynamicTypeReturn extends DynamicTypeResult {
  readonly update: () => void
  readonly reset: () => void
}

/**
 * Dynamic Type Hook
 *
 * @example
 * ```tsx
 * const dynamicType = useDynamicType({
 *   baseFontSize: 16,
 *   enableLayoutReflow: true,
 * });
 *
 * <Text style={{ fontSize: dynamicType.fontSize('base') }}>
 *   This text scales with system settings
 * </Text>
 * ```
 */
export function useDynamicType(
  options: UseDynamicTypeOptions = {}
): UseDynamicTypeReturn {
  const { updateOnChange = true, ...config } = options

  const [scaleResult, setScaleResult] = useState<DynamicTypeResult>(() =>
    calculateDynamicTypeScale(config)
  )

  const windowDimensions = useWindowDimensions()

  // Update dynamic type scale
  const update = useCallback(() => {
    const newResult = calculateDynamicTypeScale(config)
    setScaleResult(newResult)
    logger.debug('Dynamic type scale updated', {
      category: newResult.category,
      scaleFactor: newResult.scaleFactor,
    })
  }, [config])

  // Reset to default
  const reset = useCallback(() => {
    const defaultConfig: DynamicTypeConfig = {
      baseFontSize: 16,
      minFontSize: 12,
      maxFontSize: 32,
      scaleFactor: 1.25,
      lineHeightMultiplier: 1.5,
    }
    const newResult = calculateDynamicTypeScale(defaultConfig)
    setScaleResult(newResult)
    logger.debug('Dynamic type scale reset')
  }, [])

  // Monitor system font scale changes
  useEffect(() => {
    if (!updateOnChange) {
      return
    }

    // On iOS and Android, font scale changes are typically detected via app state changes
    // or when the app comes to foreground. We'll update periodically and on dimension changes.

    // Update on window dimension changes (may indicate font scale change)
    const timeoutId = setInterval(() => {
      const currentScale = getSystemFontScale()
      const currentCategory = getTextSizeCategory(currentScale)

      if (
        currentScale !== scaleResult.scaleFactor ||
        currentCategory !== scaleResult.category
      ) {
        update()
      }
    }, 1000) // Check every second

    return () => {
      clearInterval(timeoutId)
    }
  }, [updateOnChange, scaleResult.scaleFactor, scaleResult.category, update])

  // Update on window dimensions change
  useEffect(() => {
    if (updateOnChange) {
      update()
    }
  }, [windowDimensions.width, windowDimensions.height, updateOnChange, update])

  // Initial update
  useEffect(() => {
    update()
  }, [update])

  return {
    ...scaleResult,
    update,
    reset,
  }
}

/**
 * Get current system font scale
 */
export function useSystemFontScale(): number {
  const [scale, setScale] = useState(getSystemFontScale)

  useEffect(() => {
    const interval = setInterval(() => {
      const newScale = getSystemFontScale()
      if (newScale !== scale) {
        setScale(newScale)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [scale])

  return scale
}

/**
 * Get current text size category
 */
export function useTextSizeCategory(): TextSizeCategory {
  const scale = useSystemFontScale()
  return getTextSizeCategory(scale)
}
