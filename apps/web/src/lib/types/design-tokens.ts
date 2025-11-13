/**
 * Design Token Types
 * Type-safe definitions for design system tokens
 */

export type ThemeMode = 'light' | 'dark';

export interface DesignTokens {
  $schema: string;
  version: string;
  spacing: SpacingTokens;
  radii: RadiiTokens;
  shadows: ShadowTokens;
  zIndex: ZIndexTokens;
  typography: TypographyTokens;
  colors: ColorTokens;
  gradients: GradientTokens;
  motion: MotionTokens;
  hitArea: HitAreaTokens;
  breakpoints: BreakpointTokens;
}

export interface SpacingTokens {
  '0': string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  '7': string;
  '8': string;
  '9': string;
  '10': string;
  '12': string;
  '14': string;
  '16': string;
  '20': string;
  '24': string;
  '32': string;
  '40': string;
  '48': string;
}

export interface RadiiTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface ShadowTokens {
  base: string;
  raised: string;
  overlay: string;
  modal: string;
  glow: {
    primary: string;
    accent: string;
    secondary: string;
  };
}

export interface ZIndexTokens {
  base: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  overlay: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
  max: number;
}

export interface TypographyTokens {
  fontFamily: {
    display: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface ColorThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  border: string;
  input: string;
  ring: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
}

export interface ColorTokens {
  light: ColorThemeTokens;
  dark: ColorThemeTokens;
}

export interface GradientTokens {
  primary: string;
  secondary: string;
  radial: {
    primary: string;
    accent: string;
  };
  ambient: {
    warm: string;
  };
}

export interface MotionTokens {
  duration: {
    instant: string;
    fast: string;
    normal: string;
    smooth: string;
    slow: string;
    enterExit: string;
    hoverPress: string;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    spring: string;
    bounce: string;
  };
}

export interface HitAreaTokens {
  minimum: string;
}

export interface BreakpointTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export type SpacingKey = keyof SpacingTokens;
export type RadiiKey = keyof RadiiTokens;
export type ShadowKey = keyof Omit<ShadowTokens, 'glow'> | `glow.${keyof ShadowTokens['glow']}`;
export type ZIndexKey = keyof ZIndexTokens;
export type FontSizeKey = keyof TypographyTokens['fontSize'];
export type FontWeightKey = keyof TypographyTokens['fontWeight'];
export type LineHeightKey = keyof TypographyTokens['lineHeight'];
export type LetterSpacingKey = keyof TypographyTokens['letterSpacing'];
export type ColorKey = keyof ColorThemeTokens;
export type GradientKey = keyof Omit<GradientTokens, 'radial' | 'ambient'> | `radial.${keyof GradientTokens['radial']}` | `ambient.${keyof GradientTokens['ambient']}`;
export type MotionDurationKey = keyof MotionTokens['duration'];
export type MotionEasingKey = keyof MotionTokens['easing'];
export type BreakpointKey = keyof BreakpointTokens;
