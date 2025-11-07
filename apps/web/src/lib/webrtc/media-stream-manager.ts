/**
 * Media Stream Manager
 * 
 * Manages media streams for WebRTC:
 * - getUserMedia for camera/microphone
 * - getDisplayMedia for screen sharing
 * - Stream constraints and configuration
 * - Track management
 */

import { createLogger } from '@/lib/logger'
import type { MediaStream, MediaStreamConstraints } from './webrtc-types'

const logger = createLogger('MediaStreamManager')

export interface MediaStreamOptions {
  audio?: boolean | MediaTrackConstraints
  video?: boolean | MediaTrackConstraints
}

export class MediaStreamManager {
  /**
   * Get user media (camera and microphone)
   */
  async getUserMedia(options: MediaStreamOptions = {}): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: options.audio ?? true,
        video: options.video ?? true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      logger.info('Got user media', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      })
      return stream
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get user media', err, { options })
      throw err
    }
  }

  /**
   * Get display media (screen sharing)
   */
  async getDisplayMedia(options: {
    video?: boolean | MediaTrackConstraints
    audio?: boolean | MediaTrackConstraints
  } = {}): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: options.video ?? true,
        audio: options.audio ?? false
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints)
      logger.info('Got display media', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      })
      return stream
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get display media', err, { options })
      throw err
    }
  }

  /**
   * Stop all tracks in a stream
   */
  stopStream(stream: MediaStream | null): void {
    if (!stream) {
      return
    }

    for (const track of stream.getTracks()) {
      track.stop()
      logger.debug('Stopped track', { kind: track.kind, trackId: track.id })
    }
  }

  /**
   * Mute/unmute audio tracks
   */
  setAudioEnabled(stream: MediaStream, enabled: boolean): void {
    for (const track of stream.getAudioTracks()) {
      track.enabled = enabled
      logger.debug('Audio track enabled state changed', { enabled, trackId: track.id })
    }
  }

  /**
   * Enable/disable video tracks
   */
  setVideoEnabled(stream: MediaStream, enabled: boolean): void {
    for (const track of stream.getVideoTracks()) {
      track.enabled = enabled
      logger.debug('Video track enabled state changed', { enabled, trackId: track.id })
    }
  }

  /**
   * Check if device has camera
   */
  async hasCamera(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.some(device => device.kind === 'videoinput')
    } catch {
      return false
    }
  }

  /**
   * Check if device has microphone
   */
  async hasMicrophone(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.some(device => device.kind === 'audioinput')
    } catch {
      return false
    }
  }
}

export const mediaStreamManager = new MediaStreamManager()
