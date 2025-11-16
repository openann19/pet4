/**
 * Mobile typography & spacing tokens
 * Aligned with web hierarchy, tuned for premium mobile UX.
 */

export const typography = {
  // Big titles (e.g. welcome / hero screens)
  h1: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.25,
  },
  // Section titles / main headers
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
  },
  // Subsection titles / card titles
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  // Default body copy
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  // Secondary text / helper text
  'body-sm': {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  // Muted body text (for descriptions, secondary content)
  bodyMuted: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  // Small metadata (timestamps, badges subtitles)
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  // Buttons & tappable CTAs
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
  },
} as const

export type TypographyVariant = keyof typeof typography

export const getTypographyStyle = (variant: TypographyVariant) => typography[variant]

/**
 * Spacing scale for consistent vertical rhythm and padding
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const

export type SpacingSize = keyof typeof spacing
