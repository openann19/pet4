import { useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { type ThemePreset, getThemePreset, applyThemePreset } from '@/lib/theme-presets'
import { isTruthy, isDefined } from '@/core/guards';

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useStorage<Theme>('app-theme-v2', 'light')
  const [themePreset, setThemePresetState] = useStorage<ThemePreset>('app-theme-preset-v1', 'default-light')

  useEffect(() => {
    const root = document.documentElement
    
    if (isTruthy(themePreset)) {
      const preset = getThemePreset(themePreset)
      if (isTruthy(preset)) {
        applyThemePreset(preset)
        return
      }
    }
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, themePreset])

  const setTheme = (newTheme: Theme | ((current: Theme) => Theme)) => {
    setThemeState((current) => {
      const resolvedTheme = typeof newTheme === 'function' 
        ? newTheme(current || 'light')
        : newTheme
      
      setThemePresetState(resolvedTheme === 'dark' ? 'default-dark' : 'default-light')
      return resolvedTheme
    })
  }

  const toggleTheme = () => {
    setThemeState((current) => {
      const newTheme = (current || 'light') === 'dark' ? 'light' : 'dark'
      setThemePresetState(newTheme === 'dark' ? 'default-dark' : 'default-light')
      return newTheme
    })
  }

  const setThemePreset = (preset: ThemePreset | ((current: ThemePreset) => ThemePreset)) => {
    setThemePresetState((current) => {
      const resolvedPreset = typeof preset === 'function'
        ? preset(current || 'default-light')
        : preset
      
      const presetConfig = getThemePreset(resolvedPreset)
      if (isTruthy(presetConfig)) {
        setThemeState(presetConfig.mode)
      }
      
      return resolvedPreset
    })
  }

  return { 
    theme: theme || 'light', 
    setTheme, 
    toggleTheme, 
    themePreset: themePreset || 'default-light', 
    setThemePreset 
  }
}
