/**
 * Image Picker Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-image-picker.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useImagePicker } from '../use-image-picker'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as Haptics from 'expo-haptics'
import { createLogger } from '@/utils/logger'

// Mock expo-image-picker
vi.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}))

// Mock expo-image-manipulator
vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: vi.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
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

const mockImagePicker = vi.mocked(ImagePicker)
const mockImageManipulator = vi.mocked(ImageManipulator)
const mockHaptics = vi.mocked(Haptics)

describe('useImagePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('pickImage', () => {
    it('should pick image from camera successfully', async () => {
      const mockAsset = {
        uri: 'file://photo.jpg',
        width: 1920,
        height: 1080,
      }

      const mockManipulated = {
        uri: 'file://photo-manipulated.jpg',
        width: 1080,
        height: 607,
      }

      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [mockAsset],
      } as ImagePicker.ImagePickerResult)
      mockImageManipulator.manipulateAsync.mockResolvedValue(mockManipulated)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: { uri: string; width: number; height: number } | null | undefined
      await act(async () => {
        pickResult = await result.current.pickImage('camera')
      })

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      expect(pickResult).toEqual({
        uri: mockManipulated.uri,
        width: mockManipulated.width,
        height: mockManipulated.height,
      })
      expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled()
      expect(mockImagePicker.launchCameraAsync).toHaveBeenCalled()
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalled()
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light')
    })

    it('should pick image from gallery successfully', async () => {
      const mockAsset = {
        uri: 'file://photo.jpg',
        width: 1920,
        height: 1080,
      }

      const mockManipulated = {
        uri: 'file://photo-manipulated.jpg',
        width: 1080,
        height: 607,
      }

      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [mockAsset],
      } as ImagePicker.ImagePickerResult)
      mockImageManipulator.manipulateAsync.mockResolvedValue(mockManipulated)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: { uri: string; width: number; height: number } | null | undefined
      await act(async () => {
        pickResult = await result.current.pickImage('gallery')
      })

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      expect(pickResult).toEqual({
        uri: mockManipulated.uri,
        width: mockManipulated.width,
        height: mockManipulated.height,
      })
      expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled()
      expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalled()
    })

    it('should return null when permission is denied', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: false,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: { uri: string; width: number; height: number } | null | undefined
      await act(async () => {
        pickResult = await result.current.pickImage('camera')
      })

      expect(pickResult).toBeNull()
      expect(mockImagePicker.launchCameraAsync).not.toHaveBeenCalled()
    })

    it('should return null when user cancels', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: true,
        assets: null,
      } as ImagePicker.ImagePickerResult)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: { uri: string; width: number; height: number } | null | undefined
      await act(async () => {
        pickResult = await result.current.pickImage('camera')
      })

      expect(pickResult).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to pick image')
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchCameraAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: { uri: string; width: number; height: number } | null | undefined
      await act(async () => {
        pickResult = await result.current.pickImage('camera')
      })

      expect(pickResult).toBeNull()
      expect(createLogger('useImagePicker').error).toHaveBeenCalled()
    })
  })

  describe('pickMultipleImages', () => {
    it('should pick multiple images successfully', async () => {
      const mockAssets = [
        {
          uri: 'file://photo1.jpg',
          width: 1920,
          height: 1080,
        },
        {
          uri: 'file://photo2.jpg',
          width: 1920,
          height: 1080,
        },
      ]

      const mockManipulated1 = {
        uri: 'file://photo1-manipulated.jpg',
        width: 1080,
        height: 607,
      }

      const mockManipulated2 = {
        uri: 'file://photo2-manipulated.jpg',
        width: 1080,
        height: 607,
      }

      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: mockAssets,
      } as ImagePicker.ImagePickerResult)
      mockImageManipulator.manipulateAsync
        .mockResolvedValueOnce(mockManipulated1)
        .mockResolvedValueOnce(mockManipulated2)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: Array<{ uri: string; width: number; height: number }> | undefined
      await act(async () => {
        pickResult = await result.current.pickMultipleImages(5)
      })

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      expect(pickResult).toHaveLength(2)
      expect(pickResult?.[0]).toEqual({
        uri: mockManipulated1.uri,
        width: mockManipulated1.width,
        height: mockManipulated1.height,
      })
    })

    it('should respect maxCount limit', async () => {
      const mockAssets = Array.from({ length: 10 }, (_, i) => ({
        uri: `file://photo${i}.jpg`,
        width: 1920,
        height: 1080,
      }))

      const mockManipulated = {
        uri: 'file://photo-manipulated.jpg',
        width: 1080,
        height: 607,
      }

      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: mockAssets,
      } as ImagePicker.ImagePickerResult)
      mockImageManipulator.manipulateAsync.mockResolvedValue(mockManipulated)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: Array<{ uri: string; width: number; height: number }> | undefined
      await act(async () => {
        pickResult = await result.current.pickMultipleImages(3)
      })

      expect(pickResult).toHaveLength(3)
    })

    it('should return empty array when permission is denied', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: false,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: Array<{ uri: string; width: number; height: number }> | undefined
      await act(async () => {
        pickResult = await result.current.pickMultipleImages()
      })

      expect(pickResult).toEqual([])
    })

    it('should return empty array when user cancels', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
        assets: null,
      } as ImagePicker.ImagePickerResult)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: Array<{ uri: string; width: number; height: number }> | undefined
      await act(async () => {
        pickResult = await result.current.pickMultipleImages()
      })

      expect(pickResult).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to pick images')
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      mockImagePicker.launchImageLibraryAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useImagePicker())

      let pickResult: Array<{ uri: string; width: number; height: number }> | undefined
      await act(async () => {
        pickResult = await result.current.pickMultipleImages()
      })

      expect(pickResult).toEqual([])
      expect(createLogger('useImagePicker').error).toHaveBeenCalled()
    })
  })

  describe('isProcessing', () => {
    it('should set isProcessing during image pick', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true,
        expires: 'never' as const,
        canAskAgain: true,
      } as ImagePicker.PermissionResponse)
      let resolveLaunch: (value: ImagePicker.ImagePickerResult) => void
      const launchPromise = new Promise<ImagePicker.ImagePickerResult>(resolve => {
        resolveLaunch = resolve
      })
      mockImagePicker.launchCameraAsync.mockReturnValue(launchPromise)

      const { result } = renderHook(() => useImagePicker())

      act(() => {
        void result.current.pickImage('camera')
      })

      expect(result.current.isProcessing).toBe(true)

      await act(async () => {
        resolveLaunch!({
          canceled: false,
          assets: [
            {
              uri: 'file://photo.jpg',
              width: 1920,
              height: 1080,
            },
          ],
        } as ImagePicker.ImagePickerResult)
        await launchPromise
      })

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })
    })
  })
})
