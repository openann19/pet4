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
    await setThemeState((current) => {
      const resolvedTheme =
        typeof newTheme === 'function' ? newTheme(current || 'light') : newTheme;

      void setThemePresetState(resolvedTheme === 'dark' ? 'default-dark' : 'default-light');
      return resolvedTheme;
    });
  };

  const toggleTheme = async (): Promise<void> => {
    await setThemeState((current) => {
      const newTheme = (current || 'light') === 'dark' ? 'light' : 'dark';
      void setThemePresetState(newTheme === 'dark' ? 'default-dark' : 'default-light');
      return newTheme;
    });
  };

  const setThemePreset = async (
    preset: ThemePreset | ((current: ThemePreset) => ThemePreset)
  ): Promise<void> => {
    await setThemePresetState((current) => {
      const resolvedPreset =
        typeof preset === 'function' ? preset(current || 'default-light') : preset;

      const presetConfig = getThemePreset(resolvedPreset);
      if (presetConfig) {
        void setThemeState(presetConfig.mode);
      }

      return resolvedPreset;
    });
  };

  return {
    theme: theme || 'light',
    setTheme,
    toggleTheme,
    themePreset: themePreset || 'default-light',
    setThemePreset,
  };
}
