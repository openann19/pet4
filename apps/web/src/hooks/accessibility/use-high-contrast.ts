/**
 * High Contrast Theme Hook (Web)
 *
 * Provides high contrast theme support:
 * - Detects system high contrast mode
 * - Custom high contrast themes
 * - WCAG AAA contrast ratios (7:1)
 * - Border and outline enhancements
 * - Icon and graphic adjustments
 *
 * Location: apps/web/src/hooks/accessibility/use-high-contrast.ts
 */

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import {
  getHighContrastTheme,
  applyHighContrastTheme,
  removeHighContrastTheme,
  getSystemTextSizeMultiplier,
  prefersReducedMotion,
  type TextSizeMultiplier,
} from '@/themes/high-contrast';

const logger = createLogger('high-contrast');

/**
 * High contrast mode
 */
export type HighContrastMode = 'off' | 'auto' | 'light' | 'dark';

/**
 * Contrast level
 */
export type ContrastLevel = 'normal' | 'high' | 'higher';

/**
 * High contrast color palette
 */
export interface HighContrastPalette {
  readonly background: string;
  readonly foreground: string;
  readonly primary: string;
  readonly secondary: string;
  readonly border: string;
  readonly focus: string;
  readonly error: string;
  readonly success: string;
  readonly warning: string;
}

/**
 * High contrast options
 */
export interface UseHighContrastOptions {
  readonly mode?: HighContrastMode;
  readonly contrastLevel?: ContrastLevel;
  readonly customPalette?: Partial<HighContrastPalette>;
  readonly textSize?: TextSizeMultiplier;
  readonly enableReducedMotion?: boolean;
}

/**
 * High contrast return type
 */
export interface UseHighContrastReturn {
  readonly isActive: boolean;
  readonly mode: HighContrastMode;
  readonly contrastLevel: ContrastLevel;
  readonly palette: HighContrastPalette;
  readonly textSize: TextSizeMultiplier;
  readonly toggleMode: () => void;
  readonly setMode: (mode: HighContrastMode) => void;
  readonly setTextSize: (size: TextSizeMultiplier) => void;
  readonly cssVariables: Record<string, string>;
}

// Default high contrast palettes
const HIGH_CONTRAST_LIGHT: HighContrastPalette = {
  background: '#FFFFFF',
  foreground: '#000000',
  primary: '#0000FF',
  secondary: '#4B0082',
  border: '#000000',
  focus: '#FF00FF',
  error: '#C80000',
  success: '#006400',
  warning: '#FF8C00',
};

const HIGH_CONTRAST_DARK: HighContrastPalette = {
  background: '#000000',
  foreground: '#FFFFFF',
  primary: '#00FFFF',
  secondary: '#FFFF00',
  border: '#FFFFFF',
  focus: '#FF00FF',
  error: '#FF0000',
  success: '#00FF00',
  warning: '#FFFF00',
};

export function useHighContrast(options: UseHighContrastOptions = {}): UseHighContrastReturn {
  const {
    mode: initialMode = 'auto',
    contrastLevel = 'high',
    customPalette,
    textSize: initialTextSize,
    enableReducedMotion,
  } = options;

  const [mode, setModeState] = useState<HighContrastMode>(initialMode);
  const [textSize, setTextSizeState] = useState<TextSizeMultiplier>(
    initialTextSize ?? getSystemTextSizeMultiplier()
  );
  const [isSystemHighContrast, setIsSystemHighContrast] = useState(false);
  const [prefersDark, setPrefersDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  // Detect system preferences
  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setIsSystemHighContrast(highContrastQuery.matches);
    setPrefersDark(darkModeQuery.matches);
    setReducedMotion(reducedMotionQuery.matches || (enableReducedMotion ?? false));

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsSystemHighContrast(e.matches);
      logger.debug('System high contrast changed', { enabled: e.matches });
    };

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
      logger.debug('Dark mode preference changed', { enabled: e.matches });
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches || (enableReducedMotion ?? false));
      logger.debug('Reduced motion preference changed', { enabled: e.matches });
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, [enableReducedMotion]);

  // Determine if high contrast is active
  const isActive = mode === 'light' || mode === 'dark' || (mode === 'auto' && isSystemHighContrast);

  // Determine which palette to use
  let palette: HighContrastPalette;

  if (mode === 'light') {
    palette = { ...HIGH_CONTRAST_LIGHT, ...customPalette };
  } else if (mode === 'dark') {
    palette = { ...HIGH_CONTRAST_DARK, ...customPalette };
  } else if (mode === 'auto' && isSystemHighContrast) {
    // Use system preference for dark/light
    const basePalette = prefersDark ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT;
    palette = { ...basePalette, ...customPalette };
  } else {
    // Not active, use normal contrast
    palette = prefersDark ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT;
  }

  // Set mode
  const setMode = useCallback((newMode: HighContrastMode) => {
    setModeState(newMode);
    logger.debug('High contrast mode set', { mode: newMode });
  }, []);

  // Toggle between modes
  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      switch (prev) {
        case 'off':
          return 'light';
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  }, []);

  // Set text size
  const setTextSize = useCallback((size: TextSizeMultiplier) => {
    setTextSizeState(size);
    logger.debug('Text size set', { size });
  }, []);

  // Determine theme mode for theme system
  const themeMode: 'light' | 'dark' | 'auto' = isActive
    ? mode === 'auto'
      ? 'auto'
      : mode === 'light'
        ? 'light'
        : 'dark'
    : 'light';

  // Get theme from theme system
  const theme = getHighContrastTheme({
    mode: themeMode,
    textSize,
    enableReducedMotion: reducedMotion,
    customPalette,
  });

  // Apply theme to document
  useEffect(() => {
    if (isActive) {
      applyHighContrastTheme(theme);
    } else {
      removeHighContrastTheme();
    }

    return () => {
      if (isActive) {
        removeHighContrastTheme();
      }
    };
  }, [isActive, theme]);

  return {
    isActive,
    mode,
    contrastLevel,
    palette,
    textSize,
    toggleMode,
    setMode,
    setTextSize,
    cssVariables: theme.cssVariables,
  };
}
