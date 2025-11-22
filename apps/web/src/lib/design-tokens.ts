/**
 * Design Token Utilities
 * Type-safe utilities for accessing design system tokens
 */

import type {
  DesignTokens,
  ThemeMode,
  SpacingKey,
  RadiiKey,
  ShadowKey,
  ZIndexKey,
  ColorKey,
  GradientKey,
  MotionDurationKey,
  MotionEasingKey,
  BreakpointKey,
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
} from './types/design-tokens';

import tokensData from '../../design-system/tokens.json';

const tokens = tokensData as DesignTokens;

/**
 * Get spacing token value
 */
export function getSpacing(key: SpacingKey): string {
  return tokens.spacing[key];
}

/**
 * Get radius token value
 */
export function getRadius(key: RadiiKey): string {
  return tokens.radii[key];
}

/**
 * Get shadow token value
 */
export function getShadow(key: ShadowKey): string {
  if (key.startsWith('glow.')) {
    const glowKey = key.split('.')[1] as keyof typeof tokens.shadows.glow;
    return tokens.shadows.glow[glowKey];
  }
  const shadowValue = tokens.shadows[key as keyof Omit<typeof tokens.shadows, 'glow'>];
  if (typeof shadowValue === 'string') {
    return shadowValue;
  }
  return '';
}

/**
 * Get z-index token value
 */
export function getZIndex(key: ZIndexKey): number {
  return tokens.zIndex[key];
}

/**
 * Get color token value for a specific theme
 */
export function getColor(key: ColorKey, mode: ThemeMode = 'light'): string {
  return tokens.colors[mode][key];
}

/**
 * Get gradient token value
 */
export function getGradient(key: GradientKey): string {
  if (key.startsWith('radial.')) {
    const radialKey = key.split('.')[1] as keyof typeof tokens.gradients.radial;
    return tokens.gradients.radial[radialKey];
  }
  if (key.startsWith('ambient.')) {
    const ambientKey = key.split('.')[1] as keyof typeof tokens.gradients.ambient;
    return tokens.gradients.ambient[ambientKey];
  }
  const gradientValue = tokens.gradients[key as keyof Omit<typeof tokens.gradients, 'radial' | 'ambient'>];
  if (typeof gradientValue === 'string') {
    return gradientValue;
  }
  return '';
}

/**
 * Get motion duration token value
 */
export function getMotionDuration(key: MotionDurationKey): string {
  return tokens.motion.duration[key];
}

/**
 * Get motion easing token value
 */
export function getMotionEasing(key: MotionEasingKey): string {
  return tokens.motion.easing[key];
}

/**
 * Get breakpoint token value
 */
export function getBreakpoint(key: BreakpointKey): string {
  return tokens.breakpoints[key];
}

/**
 * Get font size token value
 */
export function getFontSize(key: FontSizeKey): string {
  return tokens.typography.fontSize[key];
}

/**
 * Get font weight token value
 */
export function getFontWeight(key: FontWeightKey): number {
  return tokens.typography.fontWeight[key];
}

/**
 * Get line height token value
 */
export function getLineHeight(key: LineHeightKey): number {
  return tokens.typography.lineHeight[key];
}

/**
 * Get letter spacing token value
 */
export function getLetterSpacing(key: LetterSpacingKey): string {
  return tokens.typography.letterSpacing[key];
}

/**
 * Get font family token value
 */
export function getFontFamily(type: 'display' | 'body' | 'mono'): string {
  return tokens.typography.fontFamily[type];
}

/**
 * Get hit area minimum size
 */
export function getHitAreaMinimum(): string {
  return tokens.hitArea.minimum;
}

/**
 * Inject design tokens as CSS custom properties
 * Should be called when theme changes
 */
export function injectTokenCSSVariables(mode: ThemeMode): void {
  if (typeof window === 'undefined' || !document.documentElement) {
    return;
  }

  const root = document.documentElement;
  const themeColors = tokens.colors[mode];

  // Inject color tokens
  Object.entries(themeColors).forEach(([key, value]) => {
    const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, String(value));
  });

  root.style.setProperty('--color-background', themeColors.background);
  root.style.setProperty('--color-foreground', themeColors.foreground);
  root.style.setProperty('--color-card', themeColors.card);
  root.style.setProperty('--color-card-foreground', themeColors.cardForeground);
  root.style.setProperty('--color-popover', themeColors.popover);
  root.style.setProperty('--color-popover-foreground', themeColors.popoverForeground);
  root.style.setProperty('--color-primary', themeColors.primary);
  root.style.setProperty('--color-primary-foreground', themeColors.primaryForeground);
  root.style.setProperty('--color-secondary', themeColors.secondary);
  root.style.setProperty('--color-secondary-foreground', themeColors.secondaryForeground);
  root.style.setProperty('--color-muted', themeColors.muted);
  root.style.setProperty('--color-muted-foreground', themeColors.mutedForeground);
  root.style.setProperty('--color-accent', themeColors.accent);
  root.style.setProperty('--color-accent-foreground', themeColors.accentForeground);
  root.style.setProperty('--color-destructive', themeColors.destructive);
  root.style.setProperty('--color-destructive-foreground', themeColors.destructiveForeground);
  root.style.setProperty('--color-success', themeColors.success);
  root.style.setProperty('--color-success-foreground', themeColors.successForeground);
  root.style.setProperty('--color-warning', themeColors.warning);
  root.style.setProperty('--color-warning-foreground', themeColors.warningForeground);
  root.style.setProperty('--color-info', themeColors.info);
  root.style.setProperty('--color-info-foreground', themeColors.infoForeground);
  root.style.setProperty('--color-border', themeColors.border);
  root.style.setProperty('--color-input', themeColors.input);
  root.style.setProperty('--color-ring', themeColors.ring);
  root.style.setProperty('--color-surface', themeColors.surface);
  root.style.setProperty('--color-text-primary', themeColors.textPrimary);
  root.style.setProperty('--color-text-secondary', themeColors.textSecondary);
  root.style.setProperty('--color-text-muted', themeColors.textMuted);

  // Inject spacing tokens (design token naming)
  // Note: theme.css defines --size-* variables for Tailwind, so we keep --spacing-*
  // for design token usage to avoid conflicts
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, String(value));
  });

  // Inject radius tokens
  Object.entries(tokens.radii).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, String(value));
  });

  // Inject shadow tokens
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    if (key !== 'glow' && typeof value === 'string') {
      root.style.setProperty(`--shadow-${key}`, value);
    }
  });

  // Inject glow shadows
  Object.entries(tokens.shadows.glow).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-glow-${key}`, value);
  });

  // Inject z-index tokens
  Object.entries(tokens.zIndex).forEach(([key, value]) => {
    root.style.setProperty(`--z-index-${key}`, String(value));
  });

  // Inject typography tokens
  Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
    root.style.setProperty(`--font-family-${key}`, value);
  });

  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });

  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${key}`, String(value));
  });

  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    root.style.setProperty(`--line-height-${key}`, String(value));
  });

  Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
    root.style.setProperty(`--letter-spacing-${key}`, value);
  });

  // Inject gradient tokens
  root.style.setProperty('--gradient-primary', tokens.gradients.primary);
  root.style.setProperty('--gradient-secondary', tokens.gradients.secondary);
  root.style.setProperty('--gradient-radial-primary', tokens.gradients.radial.primary);
  root.style.setProperty('--gradient-radial-accent', tokens.gradients.radial.accent);
  root.style.setProperty('--gradient-ambient-warm', tokens.gradients.ambient.warm);

  // Inject motion tokens
  Object.entries(tokens.motion.duration).forEach(([key, value]) => {
    root.style.setProperty(`--motion-duration-${key}`, String(value));
  });

  Object.entries(tokens.motion.easing).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS variables
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--motion-easing-${kebabKey}`, String(value));
  });

  // Inject breakpoint tokens
  Object.entries(tokens.breakpoints).forEach(([key, value]) => {
    root.style.setProperty(`--breakpoint-${key}`, String(value));
  });

  // Inject hit area
  root.style.setProperty('--hit-area-minimum', String(tokens.hitArea.minimum));
}

/**
 * Export token data for direct access if needed
 */
export { tokens };
