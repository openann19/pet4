/**
 * Camera Hook (Mobile)
 *
 * React hook for camera functionality with photo capture and video recording.
 *
 * Location: apps/mobile/src/hooks/use-camera.ts
 */

import { useCallback, useRef } from 'react'
import { CameraView as ExpoCameraView } from 'expo-camera'
import { createLogger } from '../utils/logger'

const logger = createLogger('use-camera')

/**
 * Camera hook options
 */
export interface UseCameraOptions {
  readonly cameraRef: React.RefObject<ExpoCameraView>
  readonly maxVideoDuration?: number
  readonly photoQuality?: number
}

/**
 * Camera hook return type
 */
export interface UseCameraReturn {
  readonly capturePhoto: () => Promise<string | null>
  readonly startRecording: () => Promise<void>
  readonly stopRecording: () => Promise<string | null>
  readonly switchCamera: () => void
}

/**
 * Camera Hook
 *
 * @example
 * ```tsx
 * const cameraRef = useRef<ExpoCameraView>(null);
 * const { capturePhoto, startRecording, stopRecording } = useCamera({
 *   cameraRef,
 *   maxVideoDuration: 60,
 *   photoQuality: 0.8,
 * });
 * ```
 */
export function useCamera(options: UseCameraOptions): UseCameraReturn {
  const { cameraRef, maxVideoDuration = 60, photoQuality = 0.8 } = options
  const recordingRef = useRef(false)

  // Capture photo
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current) {
      logger.warn('Camera ref not available')
      return null
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: photoQuality,
        base64: false,
      })

      if (!photo) {
        throw new Error('Failed to capture photo: photo is undefined')
      }

      logger.debug('Photo captured', { uri: photo.uri })
      return photo.uri
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to capture photo', err)
      throw err
    }
  }, [cameraRef, photoQuality])

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    if (!cameraRef.current) {
      logger.warn('Camera ref not available')
      return
    }

    if (recordingRef.current) {
      logger.warn('Recording already in progress')
      return
    }

    try {
      recordingRef.current = true
      await cameraRef.current.recordAsync({
        maxDuration: maxVideoDuration,
      })

      logger.debug('Recording started')
    } catch (error) {
      recordingRef.current = false
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to start recording', err)
      throw err
    }
  }, [cameraRef, maxVideoDuration])

  // Stop recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current) {
      logger.warn('Camera ref not available')
      return null
    }

    if (!recordingRef.current) {
      logger.warn('No recording in progress')
      return null
    }

    try {
      cameraRef.current.stopRecording()
      recordingRef.current = false

      // Note: expo-camera doesn't return the URI directly from stopRecording
      // You would typically handle this through a callback or state management
      logger.debug('Recording stopped')
      return null // Placeholder - actual implementation would return video URI
    } catch (error) {
      recordingRef.current = false
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to stop recording', err)
      throw err
    }
  }, [cameraRef])

  // Switch camera
  const switchCamera = useCallback(() => {
    // Camera switching is handled by the component via state
    logger.debug('Camera switch requested')
  }, [])

  return {
    capturePhoto,
    startRecording,
    stopRecording,
    switchCamera,
  }
}
