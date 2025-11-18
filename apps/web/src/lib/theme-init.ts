import { type ThemePreset, getThemePreset, applyThemePreset } from './theme-presets';
import { logger } from './logger';
import { injectTokenCSSVariables } from './design-tokens';
import type { ThemeMode } from './types/design-tokens';

/**
 * Initialize theme early to prevent hydration flicker
 * Must run synchronously before React renders
 */
function tryApplyThemePreset(savedThemePreset: string | null, _root: HTMLElement): boolean {
  if (!savedThemePreset) return false;
  
  try {
    const presetId = JSON.parse(savedThemePreset) as ThemePreset;
    const preset = getThemePreset(presetId);
    if (preset) {
      applyThemePreset(preset);
      injectTokenCSSVariables(preset.mode);
      return true;
    }
  } catch {
    // Ignore JSON parsing errors
  }
  return false;
}

function tryApplyTheme(savedTheme: string | null, root: HTMLElement): boolean {
  if (!savedTheme) return false;
  
  try {
    const theme = JSON.parse(savedTheme) as 'light' | 'dark';
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    injectTokenCSSVariables(theme);
    return true;
  } catch {
    // Ignore JSON parsing errors
  }
  return false;
}

function tryApplyThemeMode(savedThemeMode: string | null, root: HTMLElement): boolean {
  if (!savedThemeMode) return false;
  
  try {
    const themeMode = JSON.parse(savedThemeMode) as ThemeMode;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    injectTokenCSSVariables(themeMode);
    return true;
  } catch {
    // Ignore JSON parsing errors
  }
  return false;
}

function applyDefaultTheme(root: HTMLElement): void {
  const defaultPreset = getThemePreset('default-light');
  if (defaultPreset) {
    applyThemePreset(defaultPreset);
    injectTokenCSSVariables(defaultPreset.mode);
  } else {
    root.classList.remove('dark');
    injectTokenCSSVariables('light');
  }
}

export function initializeTheme() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  try {
    // Apply theme immediately to prevent flash of unstyled content
    // Check both new storage prefix (petspark:) and legacy prefixes (kv:, no prefix) for compatibility
    const savedThemePreset =
      localStorage.getItem('petspark:app-theme-preset-v1') ??
      localStorage.getItem('kv:app-theme-preset-v1') ??
      localStorage.getItem('app-theme-preset-v1');
    const savedTheme =
      localStorage.getItem('petspark:app-theme-v2') ??
      localStorage.getItem('kv:app-theme-v2') ??
      localStorage.getItem('app-theme-v2');
    const savedThemeMode =
      localStorage.getItem('petspark:theme-mode-v2') ??
      localStorage.getItem('theme-mode-v2');

    if (tryApplyThemePreset(savedThemePreset, root)) return;
    if (tryApplyTheme(savedTheme, root)) return;
    if (tryApplyThemeMode(savedThemeMode, root)) return;
    
    applyDefaultTheme(root);
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to initialize theme', err, { action: 'initializeTheme' });
    root.classList.remove('dark');
    try {
      injectTokenCSSVariables('light');
    } catch {
      // Silently fail if design tokens can't be injected
    }
  }
}

// Initialize immediately on module load (before React renders)
if (typeof window !== 'undefined' && document.documentElement) {
  initializeTheme();
}
