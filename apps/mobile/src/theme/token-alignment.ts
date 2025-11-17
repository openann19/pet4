/**
 * Token Alignment Utilities
 * Maps web design tokens (OKLCH / HEX) to mobile theme format.
 *
 * Location: apps/mobile/src/theme/token-alignment.ts
 */

import type { ThemeColors } from './themes'
import tokensData from '../../../web/design-system/tokens.json'

interface DesignTokens {
  colors: {
    light: Record<string, string>
    dark: Record<string, string>
  }
}

const tokens = tokensData as DesignTokens

type Mode = 'light' | 'dark'

interface ParsedOklch {
  L: number
  C: number
  h: number
  alpha?: number
}

/**
 * Parse CSS oklch() string into numeric components.
 * Supports:
 *   oklch(L C h)
 *   oklch(L C h / alpha)
 */
function parseOklch(input: string): ParsedOklch | null {
  const trimmed = input.trim().toLowerCase()

  if (!trimmed.startsWith('oklch(') || !trimmed.endsWith(')')) {
    return null
  }

  const inner = trimmed.slice('oklch('.length, -1)
  const [main, alphaPart] = inner.split('/').map((p) => p.trim())

  if (!main) {
    return null
  }

  const parts = main.split(/\s+/).filter(Boolean)
  if (parts.length < 3) return null

  const [lRaw, cRaw, hRaw] = parts as [string, string, string]

  const L0 = parseFloat(lRaw)
  const C = parseFloat(cRaw)
  const h = parseFloat(hRaw)

  if (!Number.isFinite(L0) || !Number.isFinite(C) || !Number.isFinite(h)) {
    return null
  }

  // CSS OKLCH uses 0–1 or 0–100% for L; normalize to 0–1
  const L = L0 > 1 ? L0 / 100 : L0

  let alpha: number | undefined
  if (alphaPart) {
    const a = parseFloat(alphaPart)
    if (Number.isFinite(a)) {
      alpha = a > 1 ? a / 100 : a
    }
  }

  const result: ParsedOklch = { L, C, h }

  if (alpha !== undefined) {
    result.alpha = alpha
  }

  return result
}

/**
 * Convert OKLCH → linear sRGB → gamma-corrected sRGB in [0, 1]
 * Based on Björn Ottosson's OKLab/OKLCH reference implementation.
 */
function oklchToSrgb(parsed: ParsedOklch): { r: number; g: number; b: number } {
  const { L, C, h } = parsed

  const hr = (h / 180) * Math.PI
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)

  // OKLab → LMS'
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  // LMS → linear sRGB
  let r =
    4.0767416621 * l -
    3.3077115913 * m +
    0.2309699292 * s
  let g =
    -1.2684380046 * l +
    2.6097574011 * m -
    0.3413193965 * s
  let b2 =
    -0.0041960863 * l -
    0.7034186147 * m +
    1.7076147010 * s

  const toSrgb = (c: number): number => {
    const clamped = Math.min(1, Math.max(0, c))
    if (clamped <= 0.0031308) {
      return 12.92 * clamped
    }
    return 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
  }

  r = toSrgb(r)
  g = toSrgb(g)
  b2 = toSrgb(b2)

  return { r, g, b: b2 }
}

function toChannelByte(x: number): number {
  return Math.min(255, Math.max(0, Math.round(x * 255)))
}

function srgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(toChannelByte(r))}${toHex(toChannelByte(g))}${toHex(
    toChannelByte(b)
  )}`
}

/**
 * Convert OKLCH color to HEX / HEXA.
 * If not an OKLCH string or parsing fails, returns the original input.
 */
function oklchToHex(input: string | undefined): string {
  if (!input) return '#000000'

  const parsed = parseOklch(input)
  if (!parsed) {
    // Already HEX, RGB, etc. – leave as is
    return input
  }

  const { r, g, b } = oklchToSrgb(parsed)
  const baseHex = srgbToHex(r, g, b)

  if (parsed.alpha === undefined || parsed.alpha >= 1) {
    return baseHex
  }

  // React Native supports #RRGGBBAA
  const alphaByte = toChannelByte(parsed.alpha)
  const alphaHex = alphaByte.toString(16).padStart(2, '0')
  return `${baseHex}${alphaHex}`
}

/**
 * Safe token read with fallback.
 */
function getTokenColor(
  themeColors: Record<string, string>,
  key: string,
  fallback: string
): string {
  const value = themeColors[key]
  if (!value) return fallback
  return oklchToHex(value)
}

/**
 * Get mobile theme colors from web design tokens.
 * Aligns mobile ThemeColors with web tokens while guaranteeing valid RN colors.
 */
export function getMobileThemeFromTokens(
  mode: Mode = 'light'
): ThemeColors {
  const themeColors = tokens.colors[mode]

  // Strong, contrast-safe fallbacks
  const fallback: ThemeColors = {
    background: mode === 'light' ? '#FFF9F0' : '#0D1117',
    foreground: mode === 'light' ? '#FFFFFF' : '#161B22',
    mutedForeground: mode === 'light' ? '#E5D5C5' : '#21262D',
    primary: mode === 'light' ? '#FF715B' : '#58A6FF',
    primaryForeground: '#FFFFFF',
    secondary: mode === 'light' ? '#FFE4B2' : '#388BFD',
    accent: mode === 'light' ? '#FFD580' : '#79C0FF',
    card: mode === 'light' ? '#FFFFFF' : '#161B22',
    surface: mode === 'light' ? '#FFFFFF' : '#161B22',
    textPrimary: mode === 'light' ? '#1F2933' : '#F0F6FC',
    textSecondary: mode === 'light' ? '#6B7280' : '#8B949E',
    border: mode === 'light' ? '#E5E5E5' : '#30363D',
    success: mode === 'light' ? '#22C55E' : '#3FB950',
    danger: mode === 'light' ? '#EF4444' : '#F85149',
    destructive: mode === 'light' ? '#EF4444' : '#F85149',
    destructiveForeground: '#FFFFFF',
    warning: mode === 'light' ? '#F59E0B' : '#D29922',
    info: mode === 'light' ? '#0EA5E9' : '#58A6FF',
  }

  if (!themeColors) {
    return fallback
  }

  return {
    background: getTokenColor(themeColors, 'background', fallback.background),
    foreground: getTokenColor(themeColors, 'foreground', fallback.foreground),
    mutedForeground: getTokenColor(
      themeColors,
      'mutedForeground',
      fallback.mutedForeground
    ),
    primary: getTokenColor(themeColors, 'primary', fallback.primary),
    primaryForeground: getTokenColor(
      themeColors,
      'primaryForeground',
      fallback.primaryForeground
    ),
    secondary: getTokenColor(themeColors, 'secondary', fallback.secondary),
    accent: getTokenColor(themeColors, 'accent', fallback.accent),
    card: getTokenColor(themeColors, 'card', fallback.card),
    surface: getTokenColor(themeColors, 'surface', fallback.surface),
    textPrimary: getTokenColor(
      themeColors,
      'textPrimary',
      fallback.textPrimary
    ),
    textSecondary: getTokenColor(
      themeColors,
      'textSecondary',
      // allow web tokens to use "textMuted" / "mutedForeground"
      themeColors.textMuted ??
        themeColors.mutedForeground ??
        fallback.textSecondary
    ),
    border: getTokenColor(themeColors, 'border', fallback.border),
    success: getTokenColor(themeColors, 'success', fallback.success),
    danger: getTokenColor(themeColors, 'destructive', fallback.danger),
    destructive: getTokenColor(
      themeColors,
      'destructive',
      fallback.destructive
    ),
    destructiveForeground: getTokenColor(
      themeColors,
      'destructiveForeground',
      fallback.destructiveForeground
    ),
    warning: getTokenColor(themeColors, 'warning', fallback.warning),
    info: getTokenColor(themeColors, 'info', fallback.info),
  }
}

/**
 * Create aligned theme from web tokens.
 * Used when you want a Theme object wired to tokens.
 */
export function createAlignedTheme(
  themeId: string,
  themeName: string,
  mode: Mode = 'light'
): { id: string; name: string; colors: ThemeColors } {
  return {
    id: themeId,
    name: themeName,
    colors: getMobileThemeFromTokens(mode),
  }
}
