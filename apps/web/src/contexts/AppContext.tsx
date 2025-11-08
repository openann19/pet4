import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { type Language, type translations } from '@/lib/i18n';
import { type ThemePreset } from '@/lib/theme-presets';

type TranslationType = (typeof translations)['en'] | (typeof translations)['bg'];

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme | ((current: Theme) => Theme)) => void;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset | ((current: ThemePreset) => ThemePreset)) => void;
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language | ((current: Language) => Language)) => void;
  t: TranslationType;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const themeState = useTheme();
  const languageState = useLanguage();

  return (
    <AppContext.Provider
      value={{
        ...themeState,
        ...languageState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
