/**
 * App Review Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-app-review.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useAppReview } from '../use-app-review'
import * as StoreReview from 'expo-store-review'
import { createLogger } from '@/utils/logger'

// Mock expo-store-review
vi.mock('expo-store-review', () => ({
  isAvailableAsync: vi.fn(),
  requestReview: vi.fn(),
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

const mockStoreReview = vi.mocked(StoreReview)

describe('useAppReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAvailability', () => {
    it('should set isAvailable to true when review is available', async () => {
      mockStoreReview.isAvailableAsync.mockResolvedValue(true)

      const { result } = renderHook(() => useAppReview())

      await act(async () => {
        await result.current.checkAvailability()
      })

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true)
      })

      expect(mockStoreReview.isAvailableAsync).toHaveBeenCalled()
    })

    it('should set isAvailable to false when review is not available', async () => {
      mockStoreReview.isAvailableAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useAppReview())

      await act(async () => {
        await result.current.checkAvailability()
      })

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false)
      })
    })

    it('should check availability on mount', async () => {
      mockStoreReview.isAvailableAsync.mockResolvedValue(true)

      renderHook(() => useAppReview())

      await waitFor(() => {
        expect(mockStoreReview.isAvailableAsync).toHaveBeenCalled()
      })
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to check availability')
      mockStoreReview.isAvailableAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useAppReview())

      await act(async () => {
        await result.current.checkAvailability()
      })

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false)
      })

      expect(createLogger('useAppReview').error).toHaveBeenCalled()
    })
  })

  describe('requestReview', () => {
    it('should request review successfully when available', async () => {
      mockStoreReview.isAvailableAsync.mockResolvedValue(true)
      mockStoreReview.requestReview.mockResolvedValue()

      const { result } = renderHook(() => useAppReview())

      await act(async () => {
        await result.current.requestReview()
      })

      expect(mockStoreReview.isAvailableAsync).toHaveBeenCalled()
      expect(mockStoreReview.requestReview).toHaveBeenCalled()
      expect(createLogger('useAppReview').info).toHaveBeenCalled()
    })

    it('should not request review when not available', async () => {
      mockStoreReview.isAvailableAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useAppReview())

      await act(async () => {
        await result.current.requestReview()
      })

      expect(mockStoreReview.isAvailableAsync).toHaveBeenCalled()
      expect(mockStoreReview.requestReview).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Request review failed')
      mockStoreReview.isAvailableAsync.mockResolvedValue(true)
      mockStoreReview.requestReview.mockRejectedValue(error)

      const { result } = renderHook(() => useAppReview())

      await act(async () => {
        await result.current.requestReview()
      })

      expect(createLogger('useAppReview').error).toHaveBeenCalled()
    })
  })

  describe('initial state', () => {
    it('should initialize with isAvailable as false', () => {
      const { result } = renderHook(() => useAppReview())

      expect(result.current.isAvailable).toBe(false)
      expect(typeof result.current.requestReview).toBe('function')
      expect(typeof result.current.checkAvailability).toBe('function')
    })
  })
})
