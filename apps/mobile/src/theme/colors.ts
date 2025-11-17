/**
 * Base color convenience export for mobile
 * Location: apps/mobile/src/theme/colors.ts
 */

import { allThemes, defaultThemeId } from './themes'

const fallbackColors = {
  background: '#FFF9F0',
  foreground: '#FFFFFF',
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
  warning: '#F59E0B',
  danger: '#EF4444',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  info: '#0EA5E9',
} as const

const base =
  allThemes[defaultThemeId]?.colors ??
  Object.values(allThemes)[0]?.colors ??
  fallbackColors

export const colors = {
  background: base.background,
  card: base.card,
  surface: base.foreground, // slightly elevated surface vs background
  border: base.border,
  textPrimary: base.textPrimary,
  textSecondary: base.textSecondary,
  primary: base.primary,
  accent: base.accent,
  success: base.success,
  warning: base.warning,
  danger: base.danger,
  // Additional tokens required by components
  foreground: base.foreground,
  mutedForeground: base.mutedForeground,
  primaryForeground: base.primaryForeground,
  destructive: base.destructive,
  destructiveForeground: base.destructiveForeground,
  // Aliases for component compatibility
  error: base.danger, // error is an alias for danger
  text: base.textPrimary, // text is an alias for textPrimary
} as const
