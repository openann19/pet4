/**
 * WCAG Contrast Utility
 * 
 * Calculates contrast ratios and ensures AA compliance (4.5:1 for normal text, 3:1 for large text)
 * Used to verify button color tokens meet accessibility requirements
 */

export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '')
  const num = parseInt(cleanHex, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/**
 * Calculate relative luminance according to WCAG 2.1
 */
export function getLuminance(rgb: RGB): number {
  const normalize = (val: number): number => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  }

  return (
    0.2126 * normalize(rgb.r) +
    0.7152 * normalize(rgb.g) +
    0.0722 * normalize(rgb.b)
  )
}

/**
 * Calculate contrast ratio between two colors
 * WCAG requires: 4.5:1 for normal text, 3:1 for large text, 3:1 for UI components
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  const lum1 = getLuminance(rgb1)
  const lum2 = getLuminance(rgb2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG AA standard for normal text (4.5:1)
 */
export function meetsAANormal(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5
}

/**
 * Check if contrast meets WCAG AA standard for large text (3:1)
 */
export function meetsAALarge(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 3.0
}

/**
 * Check if contrast meets WCAG AA standard for UI components (3:1)
 */
export function meetsAAUI(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 3.0
}

/**
 * Ensure button text meets minimum contrast requirements
 * Returns the appropriate text color for the given background
 */
export function getAccessibleTextColor(
  backgroundColor: string,
  lightText: string = '#FFFFFF',
  darkText: string = '#000000'
): string {
  const contrastWithLight = getContrastRatio(lightText, backgroundColor)
  const contrastWithDark = getContrastRatio(darkText, backgroundColor)

  // Prefer higher contrast, but both must meet 3:1 for UI components
  if (contrastWithLight >= 3.0 && contrastWithLight >= contrastWithDark) {
    return lightText
  }
  if (contrastWithDark >= 3.0) {
    return darkText
  }

  // If neither meets minimum, use the one with better contrast
  // For dark colors (low luminance), white usually works better
  // For light colors (high luminance), black usually works better
  const bgLuminance = getLuminance(hexToRgb(backgroundColor))
  if (bgLuminance < 0.5) {
    return lightText // Dark background, use light text
  }
  return darkText // Light background, use dark text
}

/**
 * Verify button color pair meets accessibility requirements
 */
export interface ContrastCheckResult {
  passes: boolean
  ratio: number
  meetsAA: boolean
  foreground: string
  background: string
}

export function verifyButtonContrast(
  foreground: string,
  background: string
): ContrastCheckResult {
  const ratio = getContrastRatio(foreground, background)
  const meetsAA = meetsAAUI(foreground, background)

  return {
    passes: meetsAA,
    ratio,
    meetsAA,
    foreground,
    background,
  }
}
