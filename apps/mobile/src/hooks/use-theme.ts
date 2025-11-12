import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { defaultThemeId, themes, type Theme } from '../theme/themes'
import { createLogger } from '../utils/logger'
import { isTruthy, isDefined } from '@petspark/shared';

const logger = createLogger('useTheme')

const THEME_STORAGE_KEY = '@petspark/theme'

export function useTheme(): {
  theme: Theme
  themeId: string
  setTheme: (themeId: string) => Promise<void>
  availableThemes: Theme[]
} {
  const systemScheme = useColorScheme()
  const [themeId, setThemeId] = useState<string>('auto')

  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (isTruthy(saved)) {
          setThemeId(saved)
        }
      } catch {
        // Fallback to default on error
        setThemeId('auto')
      }
    }

    void loadTheme()
  }, [])

  const activeTheme = useMemo(() => {
    if (themeId === 'auto') {
      const theme = systemScheme === 'dark' ? themes['default-dark'] : themes[defaultThemeId]
      if (!theme) {
        return themes[defaultThemeId]!
      }
      return theme
    }
    return themes[themeId] ?? themes[defaultThemeId]!
  }, [themeId, systemScheme])

  const setTheme = async (newThemeId: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeId)
      setThemeId(newThemeId)
    } catch (error) {
      // Handle error silently or log it
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to save theme', err)
    }
  }

  const availableThemes = useMemo(() => Object.values(themes), [])

  return {
    theme: activeTheme,
    themeId:
      themeId === 'auto' ? (systemScheme === 'dark' ? 'default-dark' : 'default-light') : themeId,
    setTheme,
    availableThemes,
  }
}
