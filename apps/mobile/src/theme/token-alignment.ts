/**
 * Token Alignment Utilities
 * Maps web design tokens to mobile theme format
 */

import type { ThemeColors } from './themes';
import tokensData from '../../../web/design-system/tokens.json';

const tokens = tokensData as {
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};

/**
 * Convert oklch color to hex (simplified - for production use a proper converter)
 * This is a placeholder - in production you'd use a proper color conversion library
 */
function oklchToHex(oklch: string): string {
  // For now, return the oklch value as-is
  // In production, use a proper color conversion library like culori
  // This maintains the color format but mobile can handle oklch if the renderer supports it
  return oklch;
}

/**
 * Get mobile theme colors from web design tokens
 */
export function getMobileThemeFromTokens(mode: 'light' | 'dark' = 'light'): ThemeColors {
  const themeColors = tokens.colors[mode];

  return {
    background: oklchToHex(themeColors.background),
    foreground: oklchToHex(themeColors.foreground),
    primary: oklchToHex(themeColors.primary),
    secondary: oklchToHex(themeColors.secondary),
    accent: oklchToHex(themeColors.accent),
    card: oklchToHex(themeColors.card),
    textPrimary: oklchToHex(themeColors.textPrimary ?? themeColors.foreground),
    textSecondary: oklchToHex(themeColors.textMuted ?? themeColors.mutedForeground),
    border: oklchToHex(themeColors.border),
    success: oklchToHex(themeColors.success ?? '#28C76F'),
    danger: oklchToHex(themeColors.destructive),
    warning: oklchToHex(themeColors.warning ?? '#FFC107'),
    info: oklchToHex(themeColors.accent),
  };
}

/**
 * Create aligned theme from web tokens
 * This ensures mobile themes align with web design tokens
 */
export function createAlignedTheme(
  themeId: string,
  themeName: string,
  mode: 'light' | 'dark' = 'light'
): { id: string; name: string; colors: ThemeColors } {
  return {
    id: themeId,
    name: themeName,
    colors: getMobileThemeFromTokens(mode),
  };
}

