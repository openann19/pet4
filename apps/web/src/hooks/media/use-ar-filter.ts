/**
 * AR Filter Hook (Web)
 *
 * Provides AR filter capabilities with:
 * - Face detection and tracking
 * - Real-time filter application
 * - Filter library management
 * - Performance optimization (60fps target)
 * - Canvas-based rendering
 * - Sticker placement
 *
 * Location: apps/web/src/hooks/media/use-ar-filter.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '@/effects/chat/core/haptic-manager'

const logger = createLogger('ar-filter')

/**
 * Face landmark points
 */
export interface FaceLandmarks {
  readonly leftEye: { x: number; y: number }
  readonly rightEye: { x: number; y: number }
  readonly nose: { x: number; y: number }
  readonly mouth: { x: number; y: number }
  readonly chin: { x: number; y: number }
  readonly leftEar: { x: number; y: number }
  readonly rightEar: { x: number; y: number }
}

/**
 * Detected face
 */
export interface DetectedFace {
  readonly id: string
  readonly bounds: DOMRect
  readonly landmarks: FaceLandmarks
  readonly confidence: number
}

/**
 * AR filter configuration
 */
export interface ARFilter {
  readonly id: string
  readonly name: string
  readonly type: 'overlay' | 'mask' | 'effect' | 'sticker'
  readonly imageUrl?: string
  readonly effect?: (ctx: CanvasRenderingContext2D, face: DetectedFace) => void
  readonly landmarks?: readonly (keyof FaceLandmarks)[]
}

/**
 * AR filter options
 */
export interface UseARFilterOptions {
  readonly videoSource: MediaStream | null
  readonly targetFPS?: number
  readonly faceDetectionInterval?: number // ms
  readonly enablePerformanceMonitoring?: boolean
  readonly onFaceDetected?: (faces: readonly DetectedFace[]) => void
  readonly onError?: (error: Error) => void
}

/**
 * AR filter return type
 */
export interface UseARFilterReturn {
  readonly canvasRef: React.RefObject<HTMLCanvasElement>
  readonly isActive: boolean
  readonly detectedFaces: readonly DetectedFace[]
  readonly currentFilter: ARFilter | null
  readonly fps: number
  readonly applyFilter: (filter: ARFilter) => void
  readonly removeFilter: () => void
  readonly start: () => void
  readonly stop: () => void
}

const DEFAULT_TARGET_FPS = 60
const DEFAULT_FACE_DETECTION_INTERVAL = 100 // ms

// Predefined AR filters
export const AR_FILTERS: readonly ARFilter[] = [
  {
    id: 'dog-ears',
    name: 'Dog Ears',
    type: 'overlay',
    imageUrl: '/filters/dog-ears.png',
    landmarks: ['leftEar', 'rightEar'],
  },
  {
    id: 'cat-whiskers',
    name: 'Cat Whiskers',
    type: 'overlay',
    imageUrl: '/filters/cat-whiskers.png',
    landmarks: ['nose', 'mouth'],
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    type: 'overlay',
    imageUrl: '/filters/sunglasses.png',
    landmarks: ['leftEye', 'rightEye'],
  },
  {
    id: 'heart-eyes',
    name: 'Heart Eyes',
    type: 'effect',
    landmarks: ['leftEye', 'rightEye'],
    effect: (ctx, face) => {
      // Draw hearts over eyes
      const eyeSize = 30
      ctx.fillStyle = '#FF1493'

      // Left eye heart
      ctx.beginPath()
      ctx.arc(face.landmarks.leftEye.x - 5, face.landmarks.leftEye.y, eyeSize / 2, 0, Math.PI * 2)
      ctx.arc(face.landmarks.leftEye.x + 5, face.landmarks.leftEye.y, eyeSize / 2, 0, Math.PI * 2)
      ctx.fill()

      // Right eye heart
      ctx.beginPath()
      ctx.arc(face.landmarks.rightEye.x - 5, face.landmarks.rightEye.y, eyeSize / 2, 0, Math.PI * 2)
      ctx.arc(face.landmarks.rightEye.x + 5, face.landmarks.rightEye.y, eyeSize / 2, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    type: 'effect',
    landmarks: ['leftEye', 'rightEye', 'nose'],
    effect: (ctx, face) => {
      // Draw sparkles around face
      const sparkles = [
        face.landmarks.leftEye,
        face.landmarks.rightEye,
        face.landmarks.nose,
      ]

      ctx.fillStyle = '#FFD700'
      ctx.strokeStyle = '#FFF'
      ctx.lineWidth = 2

      sparkles.forEach((point) => {
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.random() * 0.5
          const distance = 20 + Math.random() * 10
          const x = point.x + Math.cos(angle) * distance
          const y = point.y + Math.sin(angle) * distance

          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      })
    },
  },
]

export function useARFilter(options: UseARFilterOptions): UseARFilterReturn {
  const {
    videoSource,
    targetFPS = DEFAULT_TARGET_FPS,
    faceDetectionInterval = DEFAULT_FACE_DETECTION_INTERVAL,
    enablePerformanceMonitoring = true,
    onFaceDetected,
    onError,
  } = options

  // State
  const [isActive, setIsActive] = useState(false)
  const [detectedFaces, setDetectedFaces] = useState<readonly DetectedFace[]>([])
  const [currentFilter, setCurrentFilter] = useState<ARFilter | null>(null)
  const [fps, setFps] = useState(0)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const faceDetectionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFrameTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const filterImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  // Preload filter images
  useEffect(() => {
    AR_FILTERS.forEach((filter) => {
      if (filter.imageUrl && !filterImagesRef.current.has(filter.id)) {
        const img = new Image()
        img.src = filter.imageUrl
        img.onload = () => {
          filterImagesRef.current.set(filter.id, img)
          logger.debug('Filter image loaded', { id: filter.id })
        }
        img.onerror = () => {
          logger.error('Failed to load filter image', { id: filter.id })
        }
      }
    })
  }, [])

  // Simple face detection (mock implementation - would use ML library in production)
  const detectFaces = useCallback((): Promise<readonly DetectedFace[]> => {
    // Feature request: Integrate with actual face detection library (e.g., MediaPipe, face-api.js)
    // See: https://github.com/your-org/petspark/issues/face-detection
    // This is a mock implementation for demonstration

    if (!videoRef.current) {
      return Promise.resolve([])
    }

    // Mock face detection - center of video
    const video = videoRef.current
    const centerX = video.videoWidth / 2
    const centerY = video.videoHeight / 2
    const faceWidth = 200
    const faceHeight = 250

    const mockFace: DetectedFace = {
      id: 'face-1',
      bounds: new DOMRect(
        centerX - faceWidth / 2,
        centerY - faceHeight / 2,
        faceWidth,
        faceHeight
      ),
      landmarks: {
        leftEye: { x: centerX - 50, y: centerY - 40 },
        rightEye: { x: centerX + 50, y: centerY - 40 },
        nose: { x: centerX, y: centerY },
        mouth: { x: centerX, y: centerY + 40 },
        chin: { x: centerX, y: centerY + 80 },
        leftEar: { x: centerX - 100, y: centerY },
        rightEar: { x: centerX + 100, y: centerY },
      },
      confidence: 0.95,
    }

    return Promise.resolve([mockFace])
  }, [])

  // Run face detection periodically
  useEffect(() => {
    if (!isActive) {
      return
    }

    const runDetection = async () => {
      try {
        const faces = await detectFaces()
        setDetectedFaces(faces)
        onFaceDetected?.(faces)

        if (faces.length > 0) {
          logger.debug('Faces detected', { count: faces.length })
        }
      } catch (err) {
        logger.error('Face detection failed', err)
        onError?.(err as Error)
      }
    }

    faceDetectionTimerRef.current = setInterval(
      runDetection,
      faceDetectionInterval
    )

    return () => {
      if (faceDetectionTimerRef.current) {
        clearInterval(faceDetectionTimerRef.current)
      }
    }
  }, [isActive, faceDetectionInterval, detectFaces, onFaceDetected, onError])

  // Render loop
  const render = useCallback(
    (timestamp: number) => {
      if (!canvasRef.current || !videoRef.current || !isActive) {
        return
      }

      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        return
      }

      // Calculate FPS
      if (enablePerformanceMonitoring) {
        frameCountRef.current++
        const elapsed = timestamp - lastFrameTimeRef.current

        if (elapsed >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / elapsed))
          frameCountRef.current = 0
          lastFrameTimeRef.current = timestamp
        }
      }

      // Draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Apply filter to detected faces
      if (currentFilter && detectedFaces.length > 0) {
        detectedFaces.forEach((face) => {
          if (currentFilter.type === 'overlay' && currentFilter.imageUrl) {
            // Draw overlay image
            const img = filterImagesRef.current.get(currentFilter.id)
            if (img && currentFilter.landmarks) {
              // Position based on landmarks
              const landmarks = currentFilter.landmarks
              if (landmarks.includes('leftEar') && landmarks.includes('rightEar')) {
                // Draw between ears
                const leftEar = face.landmarks.leftEar
                const rightEar = face.landmarks.rightEar
                const width = Math.abs(rightEar.x - leftEar.x) * 1.5
                const height = width * (img.height / img.width)
                ctx.drawImage(
                  img,
                  leftEar.x - width * 0.25,
                  leftEar.y - height * 0.5,
                  width,
                  height
                )
              } else if (landmarks.includes('leftEye') && landmarks.includes('rightEye')) {
                // Draw over eyes
                const leftEye = face.landmarks.leftEye
                const rightEye = face.landmarks.rightEye
                const width = Math.abs(rightEye.x - leftEye.x) * 1.8
                const height = width * (img.height / img.width)
                ctx.drawImage(
                  img,
                  leftEye.x - width * 0.25,
                  leftEye.y - height * 0.4,
                  width,
                  height
                )
              }
            }
          } else if (currentFilter.type === 'effect' && currentFilter.effect) {
            // Apply custom effect
            currentFilter.effect(ctx, face)
          }
        })
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(render)
    },
    [isActive, currentFilter, detectedFaces, enablePerformanceMonitoring]
  )

  // Setup video source
  useEffect(() => {
    if (!videoSource || !videoRef.current) {
      return
    }

    const video = videoRef.current
    video.srcObject = videoSource
    void video.play()

    video.onloadedmetadata = () => {
      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth
        canvasRef.current.height = video.videoHeight
      }
    }

    return () => {
      video.srcObject = null
    }
  }, [videoSource])

  // Start AR filter
  const start = useCallback(() => {
    if (isActive) {
      return
    }

    setIsActive(true)
    lastFrameTimeRef.current = performance.now()
    frameCountRef.current = 0

    triggerHaptic('success')
    logger.debug('AR filter started')

    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render)
  }, [isActive, render])

  // Stop AR filter
  const stop = useCallback(() => {
    if (!isActive) {
      return
    }

    setIsActive(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (faceDetectionTimerRef.current) {
      clearInterval(faceDetectionTimerRef.current)
      faceDetectionTimerRef.current = null
    }

    setDetectedFaces([])

    logger.debug('AR filter stopped')
  }, [isActive])

  // Apply filter
  const applyFilter = useCallback(
    (filter: ARFilter) => {
      setCurrentFilter(filter)
      triggerHaptic('light')
      logger.debug('Filter applied', { id: filter.id, name: filter.name })
    },
    []
  )

  // Remove filter
  const removeFilter = useCallback(() => {
    setCurrentFilter(null)
    logger.debug('Filter removed')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    canvasRef,
    isActive,
    detectedFaces,
    currentFilter,
    fps,
    applyFilter,
    removeFilter,
    start,
    stop,
  }
}
