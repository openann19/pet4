/**
 * Color Token Utilities
 * Access design token colors from tokens.json
 */

import tokens from '../../../design-system/tokens.json';

type ThemeMode = 'light' | 'dark';

/**
 * Get a color token value for the current theme
 */
export function getColorToken(
  colorKey: keyof typeof tokens.colors.light,
  mode: ThemeMode = 'light'
): string {
  const themeColors = tokens.colors[mode];
  return themeColors[colorKey] || themeColors.foreground;
}

/**
 * Get color token with opacity applied
 */
export function getColorTokenWithOpacity(
  colorKey: keyof typeof tokens.colors.light,
  opacity: number,
  mode: ThemeMode = 'light'
): string {
  const color = getColorToken(colorKey, mode);

  // Convert OKLCH to rgba if needed
  if (color.startsWith('oklch')) {
    // For OKLCH, we'll use CSS color-mix or convert
    // For now, return as-is and let CSS handle opacity
    return color;
  }

  // If already rgba/rgb, extract and apply opacity
  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map((v) => v.trim());
    if (values.length >= 3) {
      const r = values[0];
      const g = values[1];
      const b = values[2];
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  // If hex, convert to rgba
  const hexMatch = color.match(/^#([0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
}

/**
 * Color token constants for common colors
 * These map to the design tokens
 */
export const ColorTokens = {
  // Light theme colors
  light: {
    background: () => getColorToken('background', 'light'),
    foreground: () => getColorToken('foreground', 'light'),
    primary: () => getColorToken('primary', 'light'),
    primaryForeground: () => getColorToken('primaryForeground', 'light'),
    secondary: () => getColorToken('secondary', 'light'),
    secondaryForeground: () => getColorToken('secondaryForeground', 'light'),
    accent: () => getColorToken('accent', 'light'),
    accentForeground: () => getColorToken('accentForeground', 'light'),
    muted: () => getColorToken('muted', 'light'),
    mutedForeground: () => getColorToken('mutedForeground', 'light'),
    destructive: () => getColorToken('destructive', 'light'),
    destructiveForeground: () => getColorToken('destructiveForeground', 'light'),
    border: () => getColorToken('border', 'light'),
    input: () => getColorToken('input', 'light'),
    ring: () => getColorToken('ring', 'light'),
  },
  // Dark theme colors
  dark: {
    background: () => getColorToken('background', 'dark'),
    foreground: () => getColorToken('foreground', 'dark'),
    primary: () => getColorToken('primary', 'dark'),
    primaryForeground: () => getColorToken('primaryForeground', 'dark'),
    secondary: () => getColorToken('secondary', 'dark'),
    secondaryForeground: () => getColorToken('secondaryForeground', 'dark'),
    accent: () => getColorToken('accent', 'dark'),
    accentForeground: () => getColorToken('accentForeground', 'dark'),
    muted: () => getColorToken('muted', 'dark'),
    mutedForeground: () => getColorToken('mutedForeground', 'dark'),
    destructive: () => getColorToken('destructive', 'dark'),
    destructiveForeground: () => getColorToken('destructiveForeground', 'dark'),
    border: () => getColorToken('border', 'dark'),
    input: () => getColorToken('input', 'dark'),
    ring: () => getColorToken('ring', 'dark'),
  },
} as const;

/**
 * Get CSS variable name for a color token
 * Use this when you need to reference the CSS variable instead of the value
 */
export function getColorCSSVar(colorKey: keyof typeof tokens.colors.light): string {
  // Convert camelCase to kebab-case
  const kebab = colorKey.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `var(--${kebab})`;
}
