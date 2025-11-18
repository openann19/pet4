/**
 * useTheme Hook - Theme management with persistence and type safety
 */

import * as React from 'react'

const { useState, useEffect, useCallback } = React
import { createLogger } from '@/lib/logger'

const logger = createLogger('useTheme')

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
  readonly theme: Theme
  readonly resolvedTheme: 'light' | 'dark'
  readonly systemTheme: 'light' | 'dark'
}

export interface UseThemeReturn extends ThemeState {
  readonly setTheme: (theme: Theme) => void
  readonly toggleTheme: () => void
  readonly isDark: boolean
  readonly isLight: boolean
  readonly isSystem: boolean
}

// Storage key for theme persistence
const THEME_STORAGE_KEY = 'petspark-theme'

// Get stored theme or default
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system'
  } catch (_error) {
    logger.warn('Failed to read theme from localStorage', { _error })
    return 'system'
  }
}

// Store theme preference
const storeTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (_error) {
    logger.warn('Failed to store theme in localStorage', { _error })
  }
}

/**
 * Hook to access and manage theme state
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  
  // Get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch (_error) {
      logger.warn('Failed to detect system theme preference', { _error })
      return 'light'
    }
  }, [])
  
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  // Apply theme to document
  useEffect(() => {
    const resolvedTheme = theme === 'system' ? systemTheme : theme
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolvedTheme)
      
      // Set CSS custom property for dynamic styles
      document.documentElement.style.setProperty('--theme', resolvedTheme)
      
      logger.info('Theme applied to document', { theme, resolvedTheme, systemTheme })
    }
  }, [theme, systemTheme])
  
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    storeTheme(newTheme)
    
    logger.info('Theme changed', { from: theme, to: newTheme })
  }, [theme])
  
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    logger.info('Theme toggled', { from: resolvedTheme, to: newTheme })
  }, [resolvedTheme, setTheme])
  
  return {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system'
  }
}

/**
 * Hook to get just the current theme value
 */
export function useThemeValue(): Theme {
  const { theme } = useTheme()
  return theme
}

/**
 * Hook to get just the resolved theme (light/dark)
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme } = useTheme()
  return resolvedTheme
}

/**
 * Hook to check if current theme is dark
 */
export function useIsDarkTheme(): boolean {
  const { isDark } = useTheme()
  return isDark
}

/**
 * Hook to check if current theme is light
 */
export function useIsLightTheme(): boolean {
  const { isLight } = useTheme()
  return isLight
}