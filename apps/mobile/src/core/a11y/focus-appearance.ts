/**
 * Focus Appearance Utilities (Mobile/React Native)
 *
 * Provides focus appearance utilities for React Native components.
 * Note: React Native doesn't have native focus indicators like web,
 * but we can provide utilities for accessibility focus management.
 *
 * Location: apps/mobile/src/core/a11y/focus-appearance.ts
 */

// Logger not used in this module, removed to fix ESLint error

/**
 * Focus appearance configuration for React Native
 */
export interface FocusAppearanceConfig {
  readonly enabled: boolean;
  readonly highlightColor: string;
  readonly borderWidth: number; // Minimum 2px for WCAG 2.2 AAA
  readonly borderRadius: number;
}

/**
 * Default focus appearance configuration
 */
export const DEFAULT_FOCUS_CONFIG: FocusAppearanceConfig = {
  enabled: true,
  highlightColor: '#0066cc',
  borderWidth: 2,
  borderRadius: 4,
};

/**
 * High contrast focus configuration
 */
export const HIGH_CONTRAST_FOCUS_CONFIG: FocusAppearanceConfig = {
  enabled: true,
  highlightColor: '#ffffff',
  borderWidth: 3,
  borderRadius: 4,
};

/**
 * Get focus appearance styles for React Native
 */
export function getFocusAppearanceStyles(config: FocusAppearanceConfig = DEFAULT_FOCUS_CONFIG): {
  borderWidth: number
  borderColor: string
  borderRadius: number
} {
  return {
    borderWidth: config.borderWidth,
    borderColor: config.highlightColor,
    borderRadius: config.borderRadius,
  };
}

/**
 * Validate focus appearance configuration
 */
export function validateFocusAppearanceConfig(config: FocusAppearanceConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (config.borderWidth < 2) {
    issues.push(`Border width (${config.borderWidth}px) is less than WCAG 2.2 AAA minimum (2px)`);
  }

  if (!config.highlightColor) {
    issues.push('Highlight color is not defined');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get accessible focus styles based on platform and user preferences
 */
export function getAccessibleFocusStyles(options: { highContrast?: boolean } = {}): {
  borderWidth: number
  borderColor: string
  borderRadius: number
} {
  const config = options.highContrast ? HIGH_CONTRAST_FOCUS_CONFIG : DEFAULT_FOCUS_CONFIG;

  return getFocusAppearanceStyles(config);
}
