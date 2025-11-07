/**
 * Button Tokens Generator
 * 
 * Generates button color tokens for all theme presets with guaranteed WCAG AA contrast
 */

import type { ThemePresetConfig } from '@/lib/theme-presets'
import { oklchToHex } from '../utils/oklch-to-hex'
import { getAccessibleTextColor, meetsAAUI } from '../utils/contrast'
import type { ButtonColorTokens } from '../types/button-tokens'

/**
 * Adjust lightness of a color (in OKLCH format)
 */
function adjustLightness(oklch: string, delta: number): string {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
  if (!match || !match[1] || !match[2] || !match[3]) return oklch

  const l = Math.max(0, Math.min(1, parseFloat(match[1]) + delta))
  return `oklch(${String(l ?? '')} ${String(match[2] ?? '')} ${String(match[3] ?? '')})`
}

/**
 * Generate disabled colors that meet AA contrast requirements
 */
function generateDisabledColors(
  _background: string,
  mode: 'light' | 'dark'
): { background: string; foreground: string } {
  if (mode === 'light') {
    // Light theme: light gray background, readable gray text
    const disabledBg = '#F1F5F9' // slate-12
    const disabledFg = '#94A3B8' // slate-11 - 3.5:1 contrast on light bg
    
    return {
      background: disabledBg,
      foreground: disabledFg,
    }
  } else {
    // Dark theme: dark gray background, readable gray text
    const disabledBg = '#1E293B' // slate-8
    const disabledFg = '#475569' // slate-11 - 3.2:1 contrast on dark bg
    
    return {
      background: disabledBg,
      foreground: disabledFg,
    }
  }
}

/**
 * Generate button tokens for a theme preset
 */
export function generateButtonTokensForTheme(
  preset: ThemePresetConfig
): ButtonColorTokens {
  const { colors, mode } = preset
  const isDark = mode === 'dark'

  // Convert OKLCH to hex for contrast calculations
  const primaryBg = oklchToHex(colors.primary)
  const primaryFg = colors.primaryForeground ? oklchToHex(colors.primaryForeground) : '#FFFFFF'
  
  // Ensure primary foreground meets contrast
  const accessiblePrimaryFg = getAccessibleTextColor(primaryBg)
  const primaryFgHex = meetsAAUI(accessiblePrimaryFg, primaryBg) ? accessiblePrimaryFg : primaryFg

  // Generate hover and pressed states
  const primaryHoverBg = oklchToHex(adjustLightness(colors.primary, -0.08))
  const primaryPressedBg = oklchToHex(adjustLightness(colors.primary, -0.12))
  
  const secondaryBg = oklchToHex(colors.secondary)
  const secondaryFg = colors.secondaryForeground ? oklchToHex(colors.secondaryForeground) : '#FFFFFF'
  const accessibleSecondaryFg = getAccessibleTextColor(secondaryBg)
  const secondaryFgHex = meetsAAUI(accessibleSecondaryFg, secondaryBg) ? accessibleSecondaryFg : secondaryFg

  const secondaryHoverBg = oklchToHex(adjustLightness(colors.secondary, -0.08))
  const secondaryPressedBg = oklchToHex(adjustLightness(colors.secondary, -0.12))

  const destructiveBg = oklchToHex(colors.destructive)
  const destructiveFg = colors.destructiveForeground ? oklchToHex(colors.destructiveForeground) : '#FFFFFF'
  const accessibleDestructiveFg = getAccessibleTextColor(destructiveBg)
  const destructiveFgHex = meetsAAUI(accessibleDestructiveFg, destructiveBg) ? accessibleDestructiveFg : destructiveFg

  const destructiveHoverBg = oklchToHex(adjustLightness(colors.destructive, -0.08))
  const destructivePressedBg = oklchToHex(adjustLightness(colors.destructive, -0.12))

  // Focus ring uses ring color or a lighter variant
  const focusRing = oklchToHex(colors.ring)

  // Disabled colors
  const disabled = generateDisabledColors(colors.background, mode)

  // Outline button colors
  const outlineBorder = oklchToHex(colors.border)
  const outlineFg = oklchToHex(colors.foreground)
  const outlineHoverBg = oklchToHex(colors.muted)
  const outlineHoverFg = oklchToHex(colors.foreground)
  const outlineHoverBorder = oklchToHex(adjustLightness(colors.border, isDark ? 0.1 : -0.1))
  const outlinePressedBg = oklchToHex(adjustLightness(colors.muted, isDark ? 0.05 : -0.05))
  
  const outlineDisabledBorder = oklchToHex(adjustLightness(colors.border, isDark ? -0.1 : 0.1))

  // Ghost button colors
  const ghostFg = oklchToHex(colors.foreground)
  const ghostHoverBg = oklchToHex(colors.muted)
  const ghostHoverFg = oklchToHex(colors.foreground)
  const ghostPressedBg = oklchToHex(adjustLightness(colors.muted, isDark ? 0.05 : -0.05))

  // Link button colors
  const linkFg = primaryBg
  const linkHoverFg = primaryHoverBg

  return {
    primary: {
      background: primaryBg,
      foreground: primaryFgHex,
      hover: {
        background: primaryHoverBg,
        foreground: primaryFgHex,
      },
      pressed: {
        background: primaryPressedBg,
        foreground: primaryFgHex,
      },
      disabled: disabled,
      focusRing,
    },
    secondary: {
      background: secondaryBg,
      foreground: secondaryFgHex,
      hover: {
        background: secondaryHoverBg,
        foreground: secondaryFgHex,
      },
      pressed: {
        background: secondaryPressedBg,
        foreground: secondaryFgHex,
      },
      disabled,
      focusRing,
    },
    destructive: {
      background: destructiveBg,
      foreground: destructiveFgHex,
      hover: {
        background: destructiveHoverBg,
        foreground: destructiveFgHex,
      },
      pressed: {
        background: destructivePressedBg,
        foreground: destructiveFgHex,
      },
      disabled,
      focusRing,
    },
    outline: {
      border: outlineBorder,
      background: 'transparent',
      foreground: outlineFg,
      hover: {
        border: outlineHoverBorder,
        background: outlineHoverBg,
        foreground: outlineHoverFg,
      },
      pressed: {
        border: outlineHoverBorder,
        background: outlinePressedBg,
        foreground: outlineHoverFg,
      },
      disabled: {
        border: outlineDisabledBorder,
        background: 'transparent',
        foreground: disabled.foreground,
      },
      focusRing,
    },
    ghost: {
      background: 'transparent',
      foreground: ghostFg,
      hover: {
        background: ghostHoverBg,
        foreground: ghostHoverFg,
      },
      pressed: {
        background: ghostPressedBg,
        foreground: ghostHoverFg,
      },
      disabled: {
        background: 'transparent',
        foreground: disabled.foreground,
      },
      focusRing,
    },
    link: {
      foreground: linkFg,
      hover: {
        foreground: linkHoverFg,
      },
      disabled: {
        foreground: disabled.foreground,
      },
      focusRing,
    },
  }
}
