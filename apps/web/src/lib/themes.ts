/**
 * Theme Utilities
 * Enhanced theme application with design token integration
 */

import { injectTokenCSSVariables } from './design-tokens';
import type { ThemeMode } from './types/design-tokens';

export type { ThemeMode } from './types/design-tokens';

/**
 * Apply theme mode to the document
 * Adds or removes the 'dark' class from document.documentElement
 * and injects design token CSS variables
 *
 * @param mode - Theme mode to apply ('light' | 'dark')
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined' || !document.documentElement) {
    return;
  }

  const root = document.documentElement;

  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Inject design token CSS variables for the current theme
  injectTokenCSSVariables(mode);
}

/**
 * Initialize theme on application start
 * Applies the default theme and injects CSS variables
 */
export function initializeTheme(defaultMode: ThemeMode = 'light'): void {
  applyTheme(defaultMode);
}
