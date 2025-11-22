import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { type Language, type translations } from '@/lib/i18n';
import { type ThemePreset } from '@/lib/theme-presets';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AppContext');

type TranslationType = (typeof translations)['en'] | (typeof translations)['bg'];

export interface AppState {
  readonly isOnline: boolean;
  readonly isLoading: boolean;
  readonly hasHydrated: boolean;
  readonly lastActivity: Date;
  readonly notifications: {
    readonly count: number;
    readonly hasUnread: boolean;
  };
}

export interface AppContextType {
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme | ((current: Theme) => Theme)) => void;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset | ((current: ThemePreset) => ThemePreset)) => void;
  
  // Language
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language | ((current: Language) => Language)) => void;
  t: TranslationType;
  
  // App State
  readonly state: AppState;
  readonly setLoading: (loading: boolean) => void;
  readonly updateLastActivity: () => void;
  readonly markNotificationsRead: () => void;
  readonly incrementNotificationCount: () => void;
  
  // Network
  readonly isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default app state
const defaultAppState: AppState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isLoading: false,
  hasHydrated: false,
  lastActivity: new Date(),
  notifications: {
    count: 0,
    hasUnread: false
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const themeState = useTheme();
  const languageState = useLanguage();
  
  // App state management
  const [appState, setAppState] = useState<AppState>(defaultAppState);

  // Network connectivity monitoring
  useEffect(() => {
    const updateOnlineStatus = () => {
      setAppState(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
      
      if (navigator.onLine) {
        logger.info('Connection restored');
      } else {
        logger.warn('Connection lost');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Hydration tracking
  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      hasHydrated: true
    }));
    
    logger.info('App hydrated', { 
      theme: themeState.theme,
      language: languageState.language
    });
  }, [themeState.theme, languageState.language]);

  // State management functions
  const setLoading = useCallback((loading: boolean) => {
    setAppState(prev => ({
      ...prev,
      isLoading: loading
    }));
  }, []);

  const updateLastActivity = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      lastActivity: new Date()
    }));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        hasUnread: false
      }
    }));
    
    logger.info('Notifications marked as read');
  }, []);

  const incrementNotificationCount = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      notifications: {
        count: prev.notifications.count + 1,
        hasUnread: true
      }
    }));
  }, []);

  const contextValue = useMemo(() => ({
    ...themeState,
    ...languageState,
    state: appState,
    setLoading,
    updateLastActivity,
    markNotificationsRead,
    incrementNotificationCount,
    isOnline: appState.isOnline
  }), [
    themeState,
    languageState,
    appState,
    setLoading,
    updateLastActivity,
    markNotificationsRead,
    incrementNotificationCount
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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
