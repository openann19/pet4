/**
 * Share Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-share.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useShare } from '../use-share'
import * as Sharing from 'expo-sharing'
import * as Haptics from 'expo-haptics'
import { createLogger } from '@/utils/logger'

// Mock expo-sharing
vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(),
  shareAsync: vi.fn(),
}))

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
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

const mockSharing = vi.mocked(Sharing)
const mockHaptics = vi.mocked(Haptics)

describe('useShare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('share', () => {
    it('should share successfully when sharing is available', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(true)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.share({ url: 'https://example.com' })
      })

      expect(shareResult).toBe(true)
      expect(mockSharing.isAvailableAsync).toHaveBeenCalled()
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light')
    })

    it('should return false when sharing is not available', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.share({ url: 'https://example.com' })
      })

      expect(shareResult).toBe(false)
    })

    it('should return false for text-only sharing', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(true)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.share({ message: 'Hello world' })
      })

      expect(shareResult).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Share failed')
      mockSharing.isAvailableAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.share({ url: 'https://example.com' })
      })

      expect(shareResult).toBe(false)
      expect(createLogger('useShare').error).toHaveBeenCalled()
    })
  })

  describe('shareFile', () => {
    it('should share file successfully', async () => {
      const uri = 'file://photo.jpg'
      mockSharing.isAvailableAsync.mockResolvedValue(true)
      mockSharing.shareAsync.mockResolvedValue(undefined)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.shareFile(uri)
      })

      expect(shareResult).toBe(true)
      expect(mockSharing.shareAsync).toHaveBeenCalledWith(uri, {})
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light')
    })

    it('should share file with options', async () => {
      const uri = 'file://photo.jpg'
      const options = {
        title: 'Share Photo',
        mimeType: 'image/jpeg',
      }
      mockSharing.isAvailableAsync.mockResolvedValue(true)
      mockSharing.shareAsync.mockResolvedValue(undefined)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.shareFile(uri, options)
      })

      expect(shareResult).toBe(true)
      expect(mockSharing.shareAsync).toHaveBeenCalledWith(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Photo',
      })
    })

    it('should return false when sharing is not available', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.shareFile('file://photo.jpg')
      })

      expect(shareResult).toBe(false)
      expect(mockSharing.shareAsync).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Share file failed')
      mockSharing.isAvailableAsync.mockResolvedValue(true)
      mockSharing.shareAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useShare())

      let shareResult: boolean | undefined
      await act(async () => {
        shareResult = await result.current.shareFile('file://photo.jpg')
      })

      expect(shareResult).toBe(false)
      expect(createLogger('useShare').error).toHaveBeenCalled()
    })
  })

  describe('canShare', () => {
    it('should return true when sharing is available', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(true)

      const { result } = renderHook(() => useShare())

      let canShareResult: boolean | undefined
      await act(async () => {
        canShareResult = await result.current.canShare()
      })

      expect(canShareResult).toBe(true)
      expect(mockSharing.isAvailableAsync).toHaveBeenCalled()
    })

    it('should return false when sharing is not available', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useShare())

      let canShareResult: boolean | undefined
      await act(async () => {
        canShareResult = await result.current.canShare()
      })

      expect(canShareResult).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Check availability failed')
      mockSharing.isAvailableAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useShare())

      let canShareResult: boolean | undefined
      await act(async () => {
        canShareResult = await result.current.canShare()
      })

      expect(canShareResult).toBe(false)
    })
  })
})
