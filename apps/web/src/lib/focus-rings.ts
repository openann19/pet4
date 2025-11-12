/**
 * Focus Ring Utilities
 * Provides standardized focus ring tokens and utilities
 */

/**
 * Focus ring CSS classes for interactive elements
 * Uses design tokens for consistent focus appearance
 */
export const focusRingClasses = {
  /**
   * Standard focus ring for buttons and interactive elements
   * Uses ring-2 with ring-offset-2 for proper visibility
   */
  standard: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--background)]',

  /**
   * Focus ring for dark surfaces
   * Uses card background for ring-offset
   */
  dark: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--card)]',

  /**
   * Focus ring for inputs and form elements
   */
  input: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--background)] focus-visible:outline-none',

  /**
   * Focus ring for links
   */
  link: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--background)] focus-visible:underline',
};

/**
 * Remove default browser outline without replacement
 * Should be used with focus-visible classes
 */
export const removeDefaultOutline = 'outline-none focus:outline-none';

/**
 * Get focus ring classes based on surface type
 */
export function getFocusRingClasses(surface: 'default' | 'dark' | 'input' | 'link' = 'default'): string {
  return `${focusRingClasses[surface]} ${removeDefaultOutline}`;
}

/**
 * Focus ring token values
 */
export const focusRingTokens = {
  ringWidth: '2px',
  ringOffset: '2px',
  ringColor: 'var(--ring)',
  ringOffsetColor: 'var(--background)',
  ringOffsetColorDark: 'var(--card)',
};
