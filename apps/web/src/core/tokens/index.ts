/**
 * Design Tokens - Centralized Export
 * Single source of truth for all design system values
 */

export { Dimens } from './dimens';
export { Typography } from './typography';
export { buttonTokens, getButtonTokens } from './button-colors';
export type { ButtonTokenSet } from '../types/button-tokens';
export { Motion } from './motion';
export { getColorToken, getColorTokenWithOpacity, getColorCSSVar, ColorTokens } from './colors';

/**
 * Focus ring utilities
 * Standardized focus styles for accessibility
 */
export const FocusRing = {
  /**
   * Standard focus ring class for interactive elements
   * Uses coral primary color with proper offset
   */
  standard: 'focus:outline-none focus:ring-2 focus:ring-[var(--coral-primary)] focus:ring-offset-2',

  /**
   * Focus ring with reduced offset for compact components
   */
  compact: 'focus:outline-none focus:ring-2 focus:ring-[var(--coral-primary)] focus:ring-offset-1',

  /**
   * Focus ring for buttons (uses button token focus ring)
   */
  button: 'focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2',

  /**
   * Focus ring for inputs
   */
  input: 'focus:outline-none focus:ring-2 focus:ring-[var(--coral-primary)] focus:ring-opacity-20',
} as const;

/**
 * Spacing utilities
 * Convert token values to Tailwind classes
 */
export const Spacing = {
  /**
   * Get spacing value in pixels
   */
  px: (token: keyof typeof import('./dimens').Dimens.spacing): string => {
    const { Dimens } = require('./dimens') as any;
    return `${Dimens.spacing[token]}px`;
  },

  /**
   * Get component spacing
   */
  component: (path: string): string => {
    const { Dimens } = require('./dimens') as any;
    const parts = path.split('.');
    let value: number | undefined;
    let current: unknown = Dimens.component;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return '0px';
      }
    }

    if (typeof current === 'number') {
      return `${current}px`;
    }

    return '0px';
  },
} as const;

/**
 * Border radius utilities
 */
export const Radius = {
  /**
   * Get radius value in pixels
   */
  px: (token: keyof typeof import('./dimens').Dimens.radius): string => {
    const { Dimens } = require('./dimens') as any;
    const value = Dimens.radius[token] as any;
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return '0px';
  },
} as const;
