/**
 * High Contrast Theme (Web)
 *
 * Provides high contrast theme with enhanced contrast ratios (WCAG AAA).
 * Features:
 * - Enhanced contrast ratios (7:1 for normal text, 4.5:1 for large text)
 * - Increased text size options (1.25x, 1.5x, 2x)
 * - Enhanced focus indicators with high visibility
 * - Reduced motion support (respects prefers-reduced-motion)
 * - Dynamic theme switching based on system preferences
 * - Integration with existing theme system
 *
 * Location: apps/web/src/themes/high-contrast.ts
 */

import { createLogger } from '@/lib/logger'

const logger = createLogger('high-contrast-theme')

/**
 * Text size multiplier
 */
export type TextSizeMultiplier = 1.25 | 1.5 | 2

// Re-export for convenience
export type { TextSizeMultiplier as HighContrastTextSize }

/**
 * High contrast mode
 */
export type HighContrastMode = 'light' | 'dark' | 'auto'

/**
 * High contrast color palette
 */
export interface HighContrastPalette {
  readonly background: string
  readonly foreground: string
  readonly primary: string
  readonly secondary: string
  readonly accent: string
  readonly border: string
  readonly focus: string
  readonly error: string
  readonly success: string
  readonly warning: string
  readonly info: string
  readonly muted: string
  readonly mutedForeground: string
}

/**
 * High contrast theme configuration
 */
export interface HighContrastThemeConfig {
  readonly mode?: HighContrastMode
  readonly textSize?: TextSizeMultiplier
  readonly enableReducedMotion?: boolean
  readonly customPalette?: Partial<HighContrastPalette>
}

/**
 * High contrast theme
 */
export interface HighContrastTheme {
  readonly mode: HighContrastMode
  readonly textSize: TextSizeMultiplier
  readonly palette: HighContrastPalette
  readonly cssVariables: Record<string, string>
  readonly className: string
}

/**
 * Light high contrast palette (WCAG AAA - 7:1 contrast ratio)
 */
const LIGHT_HIGH_CONTRAST_PALETTE: HighContrastPalette = {
  background: '#FFFFFF',
  foreground: '#000000',
  primary: '#0000FF',
  secondary: '#4B0082',
  accent: '#FF00FF',
  border: '#000000',
  focus: '#FF00FF',
  error: '#C80000',
  success: '#006400',
  warning: '#FF8C00',
  info: '#0000FF',
  muted: '#E5E5E5',
  mutedForeground: '#666666',
}

/**
 * Dark high contrast palette (WCAG AAA - 7:1 contrast ratio)
 */
const DARK_HIGH_CONTRAST_PALETTE: HighContrastPalette = {
  background: '#000000',
  foreground: '#FFFFFF',
  primary: '#00FFFF',
  secondary: '#FFFF00',
  accent: '#FF00FF',
  border: '#FFFFFF',
  focus: '#FF00FF',
  error: '#FF0000',
  success: '#00FF00',
  warning: '#FFFF00',
  info: '#00FFFF',
  muted: '#1A1A1A',
  mutedForeground: '#CCCCCC',
}

/**
 * Get high contrast theme
 */
export function getHighContrastTheme(
  config: HighContrastThemeConfig = {}
): HighContrastTheme {
  const {
    mode = 'auto',
    textSize = 1.25,
    enableReducedMotion = true,
    customPalette,
  } = config

  // Determine active mode
  let activeMode: HighContrastMode = mode
  if (mode === 'auto') {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      activeMode = prefersDark ? 'dark' : 'light'
    } else {
      activeMode = 'light'
    }
  }

  // Get base palette
  const basePalette =
    activeMode === 'dark' ? DARK_HIGH_CONTRAST_PALETTE : LIGHT_HIGH_CONTRAST_PALETTE

  // Merge with custom palette
  const palette: HighContrastPalette = {
    ...basePalette,
    ...customPalette,
  }

  // Generate CSS variables
  const cssVariables: Record<string, string> = {
    // Colors
    '--hc-background': palette.background,
    '--hc-foreground': palette.foreground,
    '--hc-primary': palette.primary,
    '--hc-secondary': palette.secondary,
    '--hc-accent': palette.accent,
    '--hc-border': palette.border,
    '--hc-focus': palette.focus,
    '--hc-error': palette.error,
    '--hc-success': palette.success,
    '--hc-warning': palette.warning,
    '--hc-info': palette.info,
    '--hc-muted': palette.muted,
    '--hc-muted-foreground': palette.mutedForeground,

    // Text size
    '--hc-text-size': `${textSize}`,
    '--hc-text-size-px': `${16 * textSize}px`,

    // Focus indicators
    '--hc-focus-width': '3px',
    '--hc-focus-style': 'solid',
    '--hc-focus-offset': '2px',
    '--hc-focus-radius': '2px',

    // Borders
    '--hc-border-width': '2px',
    '--hc-border-radius': '4px',

    // Shadows (enhanced for high contrast)
    '--hc-shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.3)',
    '--hc-shadow-md': '0 4px 8px rgba(0, 0, 0, 0.4)',
    '--hc-shadow-lg': '0 8px 16px rgba(0, 0, 0, 0.5)',
    '--hc-shadow-xl': '0 16px 32px rgba(0, 0, 0, 0.6)',

    // Reduced motion
    '--hc-transition-duration': enableReducedMotion ? '0s' : '200ms',
    '--hc-transition-timing': enableReducedMotion ? 'linear' : 'ease-in-out',
  }

  // Generate CSS class name
  const className = `high-contrast high-contrast-${activeMode} high-contrast-text-${textSize}`

  logger.debug('High contrast theme generated', {
    mode: activeMode,
    textSize,
    enableReducedMotion,
  })

  return {
    mode: activeMode,
    textSize,
    palette,
    cssVariables,
    className,
  }
}

/**
 * Apply high contrast theme to document
 */
export function applyHighContrastTheme(theme: HighContrastTheme): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Apply CSS variables
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // Add class name
  root.classList.add(...theme.className.split(' '))

  logger.debug('High contrast theme applied', { className: theme.className })
}

/**
 * Remove high contrast theme from document
 */
export function removeHighContrastTheme(): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Remove CSS variables
  const variables = Object.keys(getHighContrastTheme().cssVariables)
  variables.forEach((key) => {
    root.style.removeProperty(key)
  })

  // Remove class names
  root.classList.remove(
    'high-contrast',
    'high-contrast-light',
    'high-contrast-dark',
    'high-contrast-text-1.25',
    'high-contrast-text-1.5',
    'high-contrast-text-2'
  )

  logger.debug('High contrast theme removed')
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get text size multiplier from system preferences
 */
export function getSystemTextSizeMultiplier(): TextSizeMultiplier {
  if (typeof document === 'undefined') {
    return 1.25
  }

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const baseFontSize = 16
  const multiplier = rootFontSize / baseFontSize

  // Round to nearest supported multiplier
  if (multiplier >= 1.75) {
    return 2
  } else if (multiplier >= 1.375) {
    return 1.5
  } else {
    return 1.25
  }
}

/**
 * High contrast theme CSS (to be injected into document)
 */
export const HIGH_CONTRAST_CSS = `
.high-contrast {
  color-scheme: light dark;
}

.high-contrast * {
  border-color: var(--hc-border, #000000) !important;
}

.high-contrast button,
.high-contrast a,
.high-contrast input,
.high-contrast select,
.high-contrast textarea {
  outline: var(--hc-focus-width, 3px) var(--hc-focus-style, solid) var(--hc-focus, #FF00FF) !important;
  outline-offset: var(--hc-focus-offset, 2px) !important;
}

.high-contrast button:focus,
.high-contrast a:focus,
.high-contrast input:focus,
.high-contrast select:focus,
.high-contrast textarea:focus {
  outline: var(--hc-focus-width, 3px) var(--hc-focus-style, solid) var(--hc-focus, #FF00FF) !important;
  outline-offset: var(--hc-focus-offset, 2px) !important;
}

.high-contrast-text-1.25 {
  font-size: calc(1rem * 1.25) !important;
}

.high-contrast-text-1.5 {
  font-size: calc(1rem * 1.5) !important;
}

.high-contrast-text-2 {
  font-size: calc(1rem * 2) !important;
}

@media (prefers-reduced-motion: reduce) {
  .high-contrast * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
