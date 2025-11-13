/**
 * Framer Motion API: useMotionStyle
 * Equivalent to React Native Reanimated's useAnimatedStyle
 * Converts motion values to style objects for use with motion components
 */

import { useTransform, type MotionValue } from 'framer-motion'
import type { CSSProperties } from 'react'

/**
 * Transform a motion value into a CSS style property
 */
export function useMotionStyle<T extends string | number>(
  motionValue: MotionValue<T>,
  transform: (value: T) => CSSProperties
): CSSProperties {
  const style = useTransform(motionValue, transform)
  
  // Return a getter function that returns the current style
  // This mimics the behavior of useAnimatedStyle
  return {
    get value() {
      return transform(motionValue.get())
    }
  } as CSSProperties
}

/**
 * Create a style object from multiple motion values
 */
export function useMotionStyles(
  values: Record<string, MotionValue<number | string>>,
  transform?: (values: Record<string, number | string>) => CSSProperties
): CSSProperties {
  const currentValues: Record<string, number | string> = {}
  
  for (const [key, value] of Object.entries(values)) {
    currentValues[key] = value.get()
  }
  
  if (transform) {
    return transform(currentValues) as CSSProperties
  }
  
  // Default transform: convert to CSS properties
  const style: CSSProperties = {}
  
  for (const [key, val] of Object.entries(currentValues)) {
    // Convert camelCase to kebab-case for CSS properties
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    style[cssKey as keyof CSSProperties] = val as string | number
  }
  
  return style
}

/**
 * Convert Reanimated-style transform array to Framer Motion style
 */
export function convertTransformToStyle(
  transforms: Array<{ [key: string]: number | string }>
): CSSProperties {
  const transformParts: string[] = []
  
  for (const transform of transforms) {
    if (transform.scale !== undefined) {
      transformParts.push(`scale(${transform.scale})`)
    }
    if (transform.translateX !== undefined) {
      transformParts.push(`translateX(${transform.translateX}px)`)
    }
    if (transform.translateY !== undefined) {
      transformParts.push(`translateY(${transform.translateY}px)`)
    }
    if (transform.rotate !== undefined) {
      transformParts.push(`rotate(${transform.rotate}deg)`)
    }
    if (transform.rotateX !== undefined) {
      transformParts.push(`rotateX(${transform.rotateX}deg)`)
    }
    if (transform.rotateY !== undefined) {
      transformParts.push(`rotateY(${transform.rotateY}deg)`)
    }
    if (transform.rotateZ !== undefined) {
      transformParts.push(`rotateZ(${transform.rotateZ}deg)`)
    }
  }
  
  return {
    transform: transformParts.join(' ')
  }
}

