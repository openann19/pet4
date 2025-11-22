import { useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { type ThemePreset, getThemePreset, applyThemePreset } from '@/lib/theme-presets';

export type Theme = 'light' | 'dark';

export function useTheme(): {
  theme: Theme;
  setTheme: (newTheme: Theme | ((current: Theme) => Theme)) => Promise<void>;
  toggleTheme: () => Promise<void>;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset | ((current: ThemePreset) => ThemePreset)) => Promise<void>;
} {
  const [theme, setThemeState] = useStorage<Theme>('app-theme-v2', 'light');
  const [themePreset, setThemePresetState] = useStorage<ThemePreset>(
    'app-theme-preset-v1',
    'default-light'
  );

  useEffect(() => {
    const root = document.documentElement;

    if (themePreset) {
      const preset = getThemePreset(themePreset);
      if (preset) {
        applyThemePreset(preset);
        return;
      }
    }

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, themePreset]);

  const setTheme = async (newTheme: Theme | ((current: Theme) => Theme)): Promise<void> => {
    const resolvedTheme =
      typeof newTheme === 'function' ? newTheme(theme || 'light') : newTheme;
    
    // Update both theme and preset together to avoid circular updates
    await Promise.all([
      setThemeState(resolvedTheme),
      setThemePresetState(resolvedTheme === 'dark' ? 'default-dark' : 'default-light'),
    ]);
  };

  const toggleTheme = async (): Promise<void> => {
    const newTheme = (theme || 'light') === 'dark' ? 'light' : 'dark';
    
    // Update both theme and preset together to avoid circular updates
    await Promise.all([
      setThemeState(newTheme),
      setThemePresetState(newTheme === 'dark' ? 'default-dark' : 'default-light'),
    ]);
  };

  const setThemePreset = async (
    preset: ThemePreset | ((current: ThemePreset) => ThemePreset)
  ): Promise<void> => {
    const resolvedPreset =
      typeof preset === 'function' ? preset(themePreset || 'default-light') : preset;

    const presetConfig = getThemePreset(resolvedPreset);
    
    // Update both preset and theme together to avoid circular updates
    if (presetConfig) {
      await Promise.all([
        setThemePresetState(resolvedPreset),
        setThemeState(presetConfig.mode),
      ]);
    } else {
      await setThemePresetState(resolvedPreset);
    }
  };

  return {
    theme: theme || 'light',
    setTheme,
    toggleTheme,
    themePreset: themePreset || 'default-light',
    setThemePreset,
  };
}
