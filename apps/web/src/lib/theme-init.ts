import { type ThemePreset, getThemePreset, applyThemePreset } from './theme-presets';
import { logger } from './logger';

/**
 * Initialize theme early to prevent hydration flicker
 * Must run synchronously before React renders
 */
export function initializeTheme() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  try {
    // Apply theme immediately to prevent flash of unstyled content
    const savedThemePreset = localStorage.getItem('kv:app-theme-preset-v1');
    const savedTheme = localStorage.getItem('kv:app-theme-v2');

    if (savedThemePreset) {
      try {
        const presetId = JSON.parse(savedThemePreset) as ThemePreset;
        const preset = getThemePreset(presetId);
        if (preset) {
          applyThemePreset(preset);
          return;
        }
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme) as 'light' | 'dark';
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        return;
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Default to light theme if nothing saved
    const defaultPreset = getThemePreset('default-light');
    if (defaultPreset) {
      applyThemePreset(defaultPreset);
    } else {
      // Fallback: ensure dark class is removed
      root.classList.remove('dark');
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to initialize theme', err, { action: 'initializeTheme' });
    // Fallback: ensure dark class is removed on error
    root.classList.remove('dark');
  }
}

// Initialize immediately on module load (before React renders)
if (typeof window !== 'undefined' && document.documentElement) {
  initializeTheme();
}
