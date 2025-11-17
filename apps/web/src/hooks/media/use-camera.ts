/**
 * Camera Access Hook (Web)
 *
 * Provides comprehensive camera functionality:
 * - Photo and video capture
 * - Camera switching (front/back)
 * - Permission handling
 * - Flash control
 * - Resolution selection
 * - Error handling and fallbacks
 *
 * Location: apps/web/src/hooks/media/use-camera.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '@/effects/chat/core/haptic-manager'

const logger = createLogger('camera')

/**
 * Camera facing mode
 */
export type CameraFacing = 'user' | 'environment'

/**
 * Camera permission state
 */
export type PermissionState = 'prompt' | 'granted' | 'denied'

/**
 * Video quality preset
 */
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Camera constraints configuration
 */
export interface CameraConstraints {
  readonly video: boolean | MediaTrackConstraints
  readonly audio?: boolean
}

/**
 * Camera hook options
 */
export interface UseCameraOptions {
  readonly facing?: CameraFacing
  readonly videoQuality?: VideoQuality
  readonly enableAudio?: boolean
  readonly enableFlash?: boolean
  readonly autoStart?: boolean
  readonly onPermissionDenied?: () => void
  readonly onError?: (error: Error) => void
}

/**
 * Camera hook return type
 */
export interface UseCameraReturn {
  readonly stream: MediaStream | null
  readonly isActive: boolean
  readonly isLoading: boolean
  readonly permissionState: PermissionState
  readonly facing: CameraFacing
  readonly error: Error | null
  readonly videoRef: React.RefObject<HTMLVideoElement>
  readonly start: () => Promise<void>
  readonly stop: () => void
  readonly switchCamera: () => Promise<void>
  readonly capturePhoto: () => Promise<Blob | null>
  readonly startRecording: () => void
  readonly stopRecording: () => Promise<Blob | null>
  readonly isRecording: boolean
}

const VIDEO_QUALITY_PRESETS: Record<VideoQuality, MediaTrackConstraints> = {
  low: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
  },
  medium: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  high: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  ultra: {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
    frameRate: { ideal: 60 },
  },
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facing: initialFacing = 'user',
    videoQuality = 'high',
    enableAudio = false,
    autoStart = false,
    onPermissionDenied,
    onError,
  } = options

  // State
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt')
  const [facing, setFacing] = useState<CameraFacing>(initialFacing)
  const [error, setError] = useState<Error | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Check permissions
  const checkPermissions = useCallback(async (): Promise<PermissionState> => {
    try {
      if (!navigator.permissions) {
        return 'prompt'
      }

      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      const state = result.state as PermissionState
      setPermissionState(state)

      logger.debug('Camera permission state', { state })

      return state
    } catch (err) {
      logger.error('Failed to check camera permissions', err)
      return 'prompt'
    }
  }, [])

  // Get camera constraints
  const getConstraints = useCallback((): CameraConstraints => {
    const videoConstraints: MediaTrackConstraints = {
      ...VIDEO_QUALITY_PRESETS[videoQuality],
      facingMode: facing,
    }

    return {
      video: videoConstraints,
      audio: enableAudio,
    }
  }, [videoQuality, facing, enableAudio])

  // Start camera
  const start = useCallback(async () => {
    if (isActive || isLoading) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check permissions first
      const permission = await checkPermissions()

      if (permission === 'denied') {
        throw new Error('Camera permission denied')
      }

      // Get user media
      const constraints = getConstraints()
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      setStream(mediaStream)
      setIsActive(true)
      setPermissionState('granted')

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      triggerHaptic('success')

      logger.debug('Camera started', {
        facing,
        videoQuality,
        tracks: mediaStream.getTracks().length,
      })
    } catch (err) {
      const error = err as Error

      setError(error)
      setIsActive(false)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied')
        onPermissionDenied?.()
        logger.error('Camera permission denied', error)
      } else {
        logger.error('Failed to start camera', error)
      }

      onError?.(error)
      triggerHaptic('error')
    } finally {
      setIsLoading(false)
    }
  }, [
    isActive,
    isLoading,
    facing,
    videoQuality,
    checkPermissions,
    getConstraints,
    onPermissionDenied,
    onError,
  ])

  // Stop camera
  const stop = useCallback(() => {
    if (!stream) {
      return
    }

    // Stop all tracks
    stream.getTracks().forEach((track) => {
      track.stop()
    })

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStream(null)
    setIsActive(false)

    logger.debug('Camera stopped')
  }, [stream])

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!isActive) {
      return
    }

    const newFacing: CameraFacing = facing === 'user' ? 'environment' : 'user'

    // Stop current stream
    stop()

    // Update facing mode
    setFacing(newFacing)

    // Start with new facing mode
    await start()

    triggerHaptic('light')

    logger.debug('Camera switched', { newFacing })
  }, [isActive, facing, stop, start])

  // Capture photo
  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !stream) {
      logger.warn('Cannot capture photo - no video stream')
      return null
    }

    try {
      // Create canvas and draw current frame
      const canvas = document.createElement('canvas')
      const video = videoRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      })

      if (blob) {
        triggerHaptic('success')
        logger.debug('Photo captured', {
          size: blob.size,
          width: canvas.width,
          height: canvas.height,
        })
      }

      return blob
    } catch (err) {
      logger.error('Failed to capture photo', err)
      onError?.(err as Error)
      triggerHaptic('error')
      return null
    }
  }, [stream, onError])

  // Start video recording
  const startRecording = useCallback(() => {
    if (!stream || isRecording) {
      return
    }

    try {
      recordedChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      triggerHaptic('success')
      logger.debug('Recording started')
    } catch (err) {
      logger.error('Failed to start recording', err)
      onError?.(err as Error)
      triggerHaptic('error')
    }
  }, [stream, isRecording, onError])

  // Stop video recording
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null)
        return
      }

      const mediaRecorder = mediaRecorderRef.current

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        })

        setIsRecording(false)
        mediaRecorderRef.current = null
        recordedChunksRef.current = []

        triggerHaptic('success')
        logger.debug('Recording stopped', { size: blob.size })

        resolve(blob)
      }

      mediaRecorder.stop()
    })
  }, [isRecording])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start()
    }

    return () => {
      stop()
    }
  }, []) // Only run on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [stream, isRecording])

  return {
    stream,
    isActive,
    isLoading,
    permissionState,
    facing,
    error,
    videoRef,
    start,
    stop,
    switchCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    isRecording,
  }
}
