import { type ThemePreset, getThemePreset, applyThemePreset } from './theme-presets';
import { logger } from './logger';
import { injectTokenCSSVariables } from './design-tokens';
import type { ThemeMode } from './types/design-tokens';

/**
 * Initialize theme early to prevent hydration flicker
 * Must run synchronously before React renders
 */
export function initializeTheme() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  try {
    // Apply theme immediately to prevent flash of unstyled content
    // Check both new storage prefix (petspark:) and legacy prefixes (kv:, no prefix) for compatibility
    const savedThemePreset =
      localStorage.getItem('petspark:app-theme-preset-v1') ||
      localStorage.getItem('kv:app-theme-preset-v1') ||
      localStorage.getItem('app-theme-preset-v1');
    const savedTheme =
      localStorage.getItem('petspark:app-theme-v2') ||
      localStorage.getItem('kv:app-theme-v2') ||
      localStorage.getItem('app-theme-v2');
    const savedThemeMode =
      localStorage.getItem('petspark:theme-mode-v2') ||
      localStorage.getItem('theme-mode-v2');

    let themeMode: ThemeMode = 'light';

    if (savedThemePreset) {
      try {
        const presetId = JSON.parse(savedThemePreset) as ThemePreset;
        const preset = getThemePreset(presetId);
        if (preset) {
          applyThemePreset(preset);
          themeMode = preset.mode;
          // Also inject design tokens for the preset mode
          injectTokenCSSVariables(themeMode);
          return;
        }
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme) as 'light' | 'dark';
        themeMode = theme;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        // Inject design tokens for the theme mode
        injectTokenCSSVariables(themeMode);
        return;
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Check for design token theme mode storage
    if (savedThemeMode) {
      try {
        themeMode = JSON.parse(savedThemeMode) as ThemeMode;
        if (themeMode === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        injectTokenCSSVariables(themeMode);
        return;
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Default to light theme if nothing saved
    const defaultPreset = getThemePreset('default-light');
    if (defaultPreset) {
      applyThemePreset(defaultPreset);
      themeMode = defaultPreset.mode;
      injectTokenCSSVariables(themeMode);
    } else {
      // Fallback: ensure dark class is removed and inject default design tokens
      root.classList.remove('dark');
      injectTokenCSSVariables('light');
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to initialize theme', err, { action: 'initializeTheme' });
    // Fallback: ensure dark class is removed on error and inject default design tokens
    root.classList.remove('dark');
    try {
      injectTokenCSSVariables('light');
    } catch (tokenError) {
      // Silently fail if design tokens can't be injected
    }
  }
}

// Initialize immediately on module load (before React renders)
if (typeof window !== 'undefined' && document.documentElement) {
  initializeTheme();
}
