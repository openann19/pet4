/**
 * Theme system with multiple themes
 * Location: apps/mobile/src/theme/themes.ts
 */

export interface ThemeColors {
  background: string
  foreground: string
  mutedForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  accent: string
  card: string
  surface: string
  textPrimary: string
  textSecondary: string
  border: string
  success: string
  danger: string
  destructive: string
  destructiveForeground: string
  warning: string
  info: string
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
}

export const themes: Record<string, Theme> = {
  'default-light': {
    id: 'default-light',
    name: 'Default Light',
    colors: {
      // Soft warm background + clear elevated surfaces
      background: '#FFF9F0',
      foreground: '#FFF2E1', // slightly stronger surface than background
      mutedForeground: '#E5D5C5',
      primary: '#FF715B',
      primaryForeground: '#FFFFFF',
      secondary: '#FFE4B2',
      accent: '#FFD580',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      textPrimary: '#1F2933',
      textSecondary: '#6B7280',
      border: '#E5E5E5',
      success: '#22C55E',
      danger: '#EF4444',
      destructive: '#EF4444',
      destructiveForeground: '#FFFFFF',
      warning: '#F59E0B',
      info: '#0EA5E9',
    },
  },
  'default-dark': {
    id: 'default-dark',
    name: 'Default Dark',
    colors: {
      background: '#0D1117',
      foreground: '#161B22',
      mutedForeground: '#21262D',
      primary: '#E89D5C',
      primaryForeground: '#FFFFFF',
      secondary: '#8B7355',
      accent: '#FF6B6B',
      card: '#161B22',
      surface: '#161B22',
      textPrimary: '#F0F6FC',
      textSecondary: '#8B949E',
      border: '#30363D',
      success: '#3FB950',
      danger: '#F85149',
      destructive: '#F85149',
      destructiveForeground: '#FFFFFF',
      warning: '#D29922',
      info: '#58A6FF',
    },
  },
  'neon-cyber': {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    colors: {
      background: '#0A0A0F',
      foreground: '#141420',
      mutedForeground: '#1A1A2E',
      primary: '#00F5FF',
      primaryForeground: '#0A0A0F',
      secondary: '#FF00F5',
      accent: '#00FF88',
      card: '#141420',
      surface: '#141420',
      textPrimary: '#FFFFFF',
      textSecondary: '#B0B0FF',
      border: '#2A2A3F',
      success: '#00FF88',
      danger: '#FF0055',
      destructive: '#FF0055',
      destructiveForeground: '#FFFFFF',
      warning: '#FFAA00',
      info: '#00F5FF',
    },
  },
  'sunset-warm': {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    colors: {
      background: '#FFF5E6',
      foreground: '#FFE8CC',
      mutedForeground: '#E8D4B8',
      primary: '#FF6B35',
      primaryForeground: '#FFFFFF',
      secondary: '#F7931E',
      accent: '#FFB347',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      textPrimary: '#2C1810',
      textSecondary: '#8B6F47',
      border: '#FFD4A3',
      success: '#4CAF50',
      danger: '#E63946',
      destructive: '#E63946',
      destructiveForeground: '#FFFFFF',
      warning: '#FFA726',
      info: '#2196F3',
    },
  },
  'ocean-cool': {
    id: 'ocean-cool',
    name: 'Ocean Cool',
    colors: {
      background: '#E8F4F8',
      foreground: '#D1E9F0',
      mutedForeground: '#B8D8E0',
      primary: '#0288D1',
      primaryForeground: '#FFFFFF',
      secondary: '#00ACC1',
      accent: '#00BCD4',
      card: '#FFFFFF',
      surface: '#FFFFFF',
      textPrimary: '#1A237E',
      textSecondary: '#546E7A',
      border: '#B0BEC5',
      success: '#4CAF50',
      danger: '#E91E63',
      destructive: '#E91E63',
      destructiveForeground: '#FFFFFF',
      warning: '#FF9800',
      info: '#0288D1',
    },
  },
}

export const defaultThemeId = 'default-light'

/**
 * Import additional themes
 */
import { additionalThemes } from './themes-extended'

/**
 * Merge all themes (base + additional)
 */
export const allThemes: Record<string, Theme> = {
  ...themes,
  ...Object.entries(additionalThemes).reduce<Record<string, Theme>>(
    (acc, [id, theme]) => ({
      ...acc,
      [id]: { ...theme, id },
    }),
    {}
  ),
}
