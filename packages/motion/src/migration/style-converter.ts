/**
 * Migration Utilities: Style Converter
 * Convert Reanimated style objects to Framer Motion variants and styles
 */

import type { Variants } from 'framer-motion'
import type { CSSProperties } from 'react'
import { convertTransformToStyle } from '../framer-api/useMotionStyle'

/**
 * Reanimated-style transform object
 */
export interface ReanimatedTransform {
  scale?: number
  translateX?: number
  translateY?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
}

/**
 * Reanimated-style animated style
 */
export interface ReanimatedStyle {
  opacity?: number
  transform?: Array<ReanimatedTransform>
  backgroundColor?: string
  color?: string
  width?: number | string
  height?: number | string
  [key: string]: unknown
}

/**
 * Convert Reanimated style to CSS properties
 */
export function convertReanimatedStyleToCSS(
  style: ReanimatedStyle | (() => ReanimatedStyle)
): CSSProperties {
  const styleValue = typeof style === 'function' ? style() : style

  const css: CSSProperties = {}

  if (styleValue.opacity !== undefined) {
    css.opacity = styleValue.opacity
  }

  if (styleValue.backgroundColor !== undefined) {
    css.backgroundColor = String(styleValue.backgroundColor)
  }

  if (styleValue.color !== undefined) {
    css.color = String(styleValue.color)
  }

  if (styleValue.width !== undefined) {
    css.width = typeof styleValue.width === 'number' ? `${styleValue.width}px` : styleValue.width
  }

  if (styleValue.height !== undefined) {
    css.height = typeof styleValue.height === 'number' ? `${styleValue.height}px` : styleValue.height
  }

  if (styleValue.transform && Array.isArray(styleValue.transform)) {
    const transformArray: Array<{ [key: string]: number | string }> = styleValue.transform as Array<{ [key: string]: number | string }>
    const transformStyle = convertTransformToStyle(transformArray)
    Object.assign(css, transformStyle)
  }

  // Copy other properties
  for (const [key, value] of Object.entries(styleValue)) {
    if (!['opacity', 'transform', 'backgroundColor', 'color', 'width', 'height'].includes(key)) {
      const cssRecord = css as Record<string, string | number>
      cssRecord[key] = value as string | number
    }
  }

  return css
}

/**
 * Convert Reanimated style to Framer Motion variant
 */
export function convertStyleToVariant(
  style: ReanimatedStyle,
  transition?: Variants['transition']
): Variants['initial'] | Variants['animate'] | Variants['exit'] {
  const css = convertReanimatedStyleToCSS(style)
  
  const variant: Variants['initial'] = {}

  if (css.opacity !== undefined) {
    variant.opacity = css.opacity as number
  }

  if (css.transform) {
    // Parse transform string to extract values
    const transformStr = String(css.transform)
    const scaleMatch = transformStr.match(/scale\(([^)]+)\)/)
    const translateXMatch = transformStr.match(/translateX\(([^)]+)\)/)
    const translateYMatch = transformStr.match(/translateY\(([^)]+)\)/)
    const rotateMatch = transformStr.match(/rotate\(([^)]+)\)/)

    if (scaleMatch && scaleMatch[1]) {
      variant.scale = parseFloat(scaleMatch[1])
    }
    if (translateXMatch && translateXMatch[1]) {
      variant.x = parseFloat(translateXMatch[1])
    }
    if (translateYMatch && translateYMatch[1]) {
      variant.y = parseFloat(translateYMatch[1])
    }
    if (rotateMatch && rotateMatch[1]) {
      variant.rotate = parseFloat(rotateMatch[1])
    }
  }

  return variant
}

/**
 * Create Framer Motion variants from Reanimated initial and animate styles
 */
export function createVariantsFromStyles(
  initial: ReanimatedStyle,
  animate: ReanimatedStyle,
  exit?: ReanimatedStyle,
  transition?: Variants['transition']
): Variants {
  const variants: Variants = {
    initial: convertStyleToVariant(initial, transition),
    animate: convertStyleToVariant(animate, transition),
  }

  if (exit) {
    variants.exit = convertStyleToVariant(exit, transition)
  }

  if (transition) {
    variants.transition = transition
  }

  return variants
}

/**
 * Convert multiple Reanimated styles to a variants object
 * Useful for creating complex animation states
 */
export function createVariantsFromStyleMap(
  styles: Record<string, ReanimatedStyle>,
  transition?: Variants['transition']
): Variants {
  const variants: Variants = {}

  for (const [key, style] of Object.entries(styles)) {
    variants[key] = convertStyleToVariant(style, transition)
  }

  if (transition) {
    variants.transition = transition
  }

  return variants
}

