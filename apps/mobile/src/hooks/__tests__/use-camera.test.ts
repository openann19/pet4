/**
 * Camera Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-camera.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useCamera } from '../use-camera'
import type { CameraView as ExpoCameraView } from 'expo-camera'
import { createLogger } from '@/utils/logger'

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock expo-camera
vi.mock('expo-camera', () => ({
  CameraView: 'CameraView',
}))

const _mockLogger = vi.mocked(createLogger)

describe('useCamera', () => {
  let mockTakePictureAsync: ReturnType<typeof vi.fn>
  let mockRecordAsync: ReturnType<typeof vi.fn>
  let mockStopRecording: ReturnType<typeof vi.fn>

  const createMockCameraRef = (): React.RefObject<ExpoCameraView> => {
    return {
      current: {
        takePictureAsync: mockTakePictureAsync,
        recordAsync: mockRecordAsync,
        stopRecording: mockStopRecording,
      } as unknown as ExpoCameraView,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockTakePictureAsync = vi.fn()
    mockRecordAsync = vi.fn()
    mockStopRecording = vi.fn()
  })

  it('should initialize with camera ref', () => {
    const mockCameraRef = createMockCameraRef()
    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
      })
    )

    expect(result.current.capturePhoto).toBeDefined()
    expect(result.current.startRecording).toBeDefined()
    expect(result.current.stopRecording).toBeDefined()
    expect(result.current.switchCamera).toBeDefined()
  })

  it('should capture photo successfully', async () => {
    const mockPhoto = {
      uri: 'file://photo.jpg',
      width: 1920,
      height: 1080,
    }

    mockTakePictureAsync.mockResolvedValue(mockPhoto)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
        photoQuality: 0.8,
      })
    )

    let photoUri: string | null | undefined
    await act(async () => {
      photoUri = await result.current.capturePhoto()
    })

    expect(photoUri).toBe('file://photo.jpg')
    expect(mockTakePictureAsync).toHaveBeenCalledWith({
      quality: 0.8,
      base64: false,
    })
  })

  it('should return null when camera ref is not available', async () => {
    const nullRef = { current: null } as React.RefObject<ExpoCameraView>

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: nullRef,
      })
    )

    let photoUri: string | null | undefined
    await act(async () => {
      photoUri = await result.current.capturePhoto()
    })

    expect(photoUri).toBeNull()
    expect(mockTakePictureAsync).not.toHaveBeenCalled()
  })

  it('should handle photo capture errors', async () => {
    const error = new Error('Failed to take picture')
    mockTakePictureAsync.mockRejectedValue(error)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
      })
    )

    await expect(async () => {
      await act(async () => {
        await result.current.capturePhoto()
      })
    }).rejects.toThrow('Failed to take picture')
  })

  it('should start recording successfully', async () => {
    mockRecordAsync.mockResolvedValue(undefined)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
        maxVideoDuration: 60,
      })
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(mockRecordAsync).toHaveBeenCalledWith({
      maxDuration: 60,
      quality: 'high',
    })
  })

  it('should not start recording when camera ref is not available', async () => {
    const nullRef = { current: null } as React.RefObject<ExpoCameraView>

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: nullRef,
      })
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(mockRecordAsync).not.toHaveBeenCalled()
  })

  it('should handle recording errors', async () => {
    const error = new Error('Failed to start recording')
    mockRecordAsync.mockRejectedValue(error)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
      })
    )

    await expect(async () => {
      await act(async () => {
        await result.current.startRecording()
      })
    }).rejects.toThrow('Failed to start recording')
  })

  it('should stop recording successfully', async () => {
    mockStopRecording.mockReturnValue(undefined)
    mockRecordAsync.mockResolvedValue(undefined)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
      })
    )

    // Start recording first
    await act(async () => {
      await result.current.startRecording()
    })

    // Stop recording
    let videoUri: string | null | undefined
    await act(async () => {
      videoUri = await result.current.stopRecording()
    })

    expect(mockStopRecording).toHaveBeenCalled()
    // Note: expo-camera doesn't return URI directly, so this returns null
    expect(videoUri).toBeNull()
  })

  it('should return null when stopping recording without starting', async () => {
    const mockCameraRef = createMockCameraRef()
    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
      })
    )

    let videoUri: string | null | undefined
    await act(async () => {
      videoUri = await result.current.stopRecording()
    })

    expect(videoUri).toBeNull()
    expect(mockStopRecording).not.toHaveBeenCalled()
  })

  it('should switch camera', () => {
    const mockCameraRef = createMockCameraRef()
    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
      })
    )

    expect(() => {
      result.current.switchCamera()
    }).not.toThrow()
  })

  it('should use custom photo quality', async () => {
    const mockPhoto = {
      uri: 'file://photo.jpg',
      width: 1920,
      height: 1080,
    }

    mockTakePictureAsync.mockResolvedValue(mockPhoto)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
        photoQuality: 0.5,
      })
    )

    await act(async () => {
      await result.current.capturePhoto()
    })

    expect(mockTakePictureAsync).toHaveBeenCalledWith({
      quality: 0.5,
      base64: false,
    })
  })

  it('should use custom max video duration', async () => {
    mockRecordAsync.mockResolvedValue(undefined)
    const mockCameraRef = createMockCameraRef()

    const { result } = renderHook(() =>
      useCamera({
        cameraRef: mockCameraRef,
        maxVideoDuration: 120,
      })
    )

    await act(async () => {
      await result.current.startRecording()
    })

    expect(mockRecordAsync).toHaveBeenCalledWith({
      maxDuration: 120,
      quality: 'high',
    })
  })
})
