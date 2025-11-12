/**
 * Camera View Component (Mobile)
 *
 * Native camera access with photo capture, video recording, and controls.
 * Features:
 * - Native camera access (iOS/Android)
 * - Photo capture with quality settings
 * - Video recording with duration limits
 * - Front/back camera switch
 * - Flash control
 * - Camera permissions handling
 * - Image/video preview and editing
 *
 * Location: apps/mobile/src/components/camera/camera-view.tsx
 */

import React, { useCallback, useRef, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native'
import { CameraView as ExpoCameraView, useCameraPermissions, type CameraType } from 'expo-camera'
import { useCamera } from '../../hooks/use-camera'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CameraView')

/**
 * Camera view props
 */
export interface CameraViewProps {
  readonly onPhotoCapture?: (uri: string) => void
  readonly onVideoRecord?: (uri: string) => void
  readonly onClose?: () => void
  readonly maxVideoDuration?: number // seconds
  readonly photoQuality?: number // 0-1
  readonly enableFlash?: boolean
  readonly enableCameraSwitch?: boolean
  readonly testID?: string
}

/**
 * Camera View Component
 *
 * @example
 * ```tsx
 * <CameraView
 *   onPhotoCapture={(uri) => console.log('Photo captured:', uri)}
 *   onVideoRecord={(uri) => console.log('Video recorded:', uri)}
 *   maxVideoDuration={60}
 *   photoQuality={0.8}
 * />
 * ```
 */
export function CameraView({
  onPhotoCapture,
  onVideoRecord,
  onClose,
  maxVideoDuration = 60,
  photoQuality = 0.8,
  enableFlash = true,
  enableCameraSwitch = true,
  testID,
}: CameraViewProps): JSX.Element {
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<ExpoCameraView>(null)
  const [cameraType, setCameraType] = useState<CameraType>('back')
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off')
  const [isRecording, setIsRecording] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const { capturePhoto, startRecording, stopRecording, switchCamera } = useCamera({
    cameraRef,
    maxVideoDuration,
    photoQuality,
  })

  // Handle photo capture
  const handleCapturePhoto = useCallback(async () => {
    if (isCapturing || isRecording) {
      return
    }

    setIsCapturing(true)

    try {
      const uri = await capturePhoto()
      if (uri) {
        onPhotoCapture?.(uri)
        logger.debug('Photo captured', { uri })
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to capture photo', err)
      Alert.alert('Error', 'Failed to capture photo. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, isRecording, capturePhoto, onPhotoCapture])

  // Handle video recording
  const handleStartRecording = useCallback(async () => {
    if (isRecording || isCapturing) {
      return
    }

    setIsRecording(true)

    try {
      await startRecording()
      logger.debug('Video recording started')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to start recording', err)
      Alert.alert('Error', 'Failed to start recording. Please try again.')
      setIsRecording(false)
    }
  }, [isRecording, isCapturing, startRecording])

  const handleStopRecording = useCallback(async () => {
    if (!isRecording) {
      return
    }

    try {
      const uri = await stopRecording()
      if (uri) {
        onVideoRecord?.(uri)
        logger.debug('Video recorded', { uri })
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to stop recording', err)
      Alert.alert('Error', 'Failed to stop recording. Please try again.')
    } finally {
      setIsRecording(false)
    }
  }, [isRecording, stopRecording, onVideoRecord])

  // Handle camera switch
  const handleSwitchCamera = useCallback(() => {
    if (!enableCameraSwitch) {
      return
    }

    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))
    switchCamera()
    logger.debug('Camera switched', { cameraType: cameraType === 'back' ? 'front' : 'back' })
  }, [enableCameraSwitch, cameraType, switchCamera])

  // Handle flash toggle
  const handleToggleFlash = useCallback(() => {
    if (!enableFlash) {
      return
    }

    setFlashMode((prev) => {
      switch (prev) {
        case 'off':
          return 'on'
        case 'on':
          return 'auto'
        case 'auto':
          return 'off'
        default:
          return 'off'
      }
    })

    logger.debug('Flash mode toggled', { flashMode })
  }, [enableFlash, flashMode])

  // Handle permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            const result = await requestPermission()
            if (!result.granted) {
              Alert.alert('Permission Denied', 'Camera permission is required to take photos and videos')
            }
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container} testID={testID}>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
      >
        <View style={styles.controls}>
          {/* Top controls */}
          <View style={styles.topControls}>
            {onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}

            {enableFlash && (
              <TouchableOpacity style={styles.flashButton} onPress={handleToggleFlash} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
                <Text style={styles.flashButtonText}>
                  {flashMode === 'off' ? '⚡' : flashMode === 'on' ? '⚡' : '⚡'}
                </Text>
              </TouchableOpacity>
            )}

            {enableCameraSwitch && (
              <TouchableOpacity style={styles.switchButton} onPress={handleSwitchCamera} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
                <Text style={styles.switchButtonText}>🔄</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            {!isRecording ? (
              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                onPress={handleCapturePhoto}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color="var(--color-bg-overlay)" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.recordButton, styles.recordButtonActive]}
                onPress={handleStopRecording}
              >
                <View style={styles.recordButtonInner} />
              </TouchableOpacity>
            )}

            {!isRecording && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={handleStartRecording}
                disabled={isCapturing}
              >
                <Text style={styles.recordButtonText}>REC</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ExpoCameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--color-fg)',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 20,
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchButtonText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'var(--color-bg-overlay)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'var(--color-fg)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'var(--color-bg-overlay)',
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'var(--color-bg-overlay)',
  },
  recordButtonActive: {
    backgroundColor: '#ff0000',
  },
  recordButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'var(--color-bg-overlay)',
  },
  recordButtonText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  permissionText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
