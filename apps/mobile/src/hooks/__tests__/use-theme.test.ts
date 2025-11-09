/**
 * Theme Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-theme.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useTheme } from '../use-theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'react-native'
import { createLogger } from '@/utils/logger'

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

// Mock useColorScheme
vi.mock('react-native', () => ({
  useColorScheme: vi.fn(() => 'light'),
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockAsyncStorage = vi.mocked(AsyncStorage)
const mockUseColorScheme = vi.mocked(useColorScheme)

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseColorScheme.mockReturnValue('light')
  })

  it('should load saved theme from storage', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('dark')

    const { result } = renderHook(() => useTheme())

    await waitFor(() => {
      expect(result.current.themeId).toBe('dark')
    })

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@petspark/theme')
  })

  it('should use auto theme by default', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)

    const { result } = renderHook(() => useTheme())

    await waitFor(() => {
      expect(result.current.themeId).toBeDefined()
    })
  })

  it('should set theme successfully', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)
    mockAsyncStorage.setItem.mockResolvedValue()

    const { result } = renderHook(() => useTheme())

    await waitFor(() => {
      expect(result.current.themeId).toBeDefined()
    })

    await act(async () => {
      await result.current.setTheme('dark')
    })

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@petspark/theme', 'dark')
    expect(result.current.themeId).toBe('dark')
  })

  it('should handle setTheme errors gracefully', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)
    const error = new Error('Failed to save theme')
    mockAsyncStorage.setItem.mockRejectedValue(error)

    const { result } = renderHook(() => useTheme())

    await waitFor(() => {
      expect(result.current.themeId).toBeDefined()
    })

    await act(async () => {
      await result.current.setTheme('dark')
    })

    expect(createLogger('useTheme').error).toHaveBeenCalled()
  })

  it('should use system color scheme when theme is auto', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('auto')
    mockUseColorScheme.mockReturnValue('dark')

    const { result } = renderHook(() => useTheme())

    await waitFor(() => {
      expect(result.current.theme).toBeDefined()
    })

    expect(result.current.themeId).toBe('default-dark')
  })

  it('should return available themes', () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)

    const { result } = renderHook(() => useTheme())

    expect(result.current.availableThemes).toBeDefined()
    expect(Array.isArray(result.current.availableThemes)).toBe(true)
  })

  it('should fallback to default theme on load error', async () => {
    const error = new Error('Failed to load theme')
    mockAsyncStorage.getItem.mockRejectedValue(error)

    const { result } = renderHook(() => useTheme())

    await waitFor(() => {
      expect(result.current.themeId).toBe('auto')
    })
  })
})
