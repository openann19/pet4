/**
 * WebRTC Peer Connection Manager
 * 
 * Manages WebRTC peer connections with:
 * - STUN/TURN server configuration
 * - ICE candidate handling
 * - Connection state management
 * - Multiple peer support for group calls
 * - Proper cleanup and resource management
 */

import { createLogger } from '@/lib/logger'
import type { RTCConfiguration, RTCPeerConnection, RTCIceCandidate, RTCTrackEvent, MediaStream } from './webrtc-types'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('PeerConnectionManager')

export interface PeerConnectionConfig {
  stunServers?: Array<{ urls: string | string[] }>
  turnServers?: Array<{
    urls: string | string[]
    username?: string
    credential?: string
  }>
  iceTransportPolicy?: 'all' | 'relay'
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle'
  rtcpMuxPolicy?: 'negotiate' | 'require'
}

export interface PeerConnectionEvents {
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
  onIceConnectionStateChange: (state: RTCIceConnectionState) => void
  onIceGatheringStateChange: (state: RTCIceGatheringState) => void
  onIceCandidate: (candidate: RTCIceCandidate) => void
  onTrack: (event: RTCTrackEvent) => void
  onError: (error: Error) => void
}

export class PeerConnectionManager {
  private peerConnection: RTCPeerConnection | null = null
  private config: RTCConfiguration
  private events: Partial<PeerConnectionEvents> = {}
  private localStream: MediaStream | null = null
  private remoteStreams: Map<string, MediaStream> = new Map()

  constructor(config: PeerConnectionConfig = {}) {
    this.config = this.buildRTCConfiguration(config)
  }

  /**
   * Build RTCConfiguration from config
   */
  private buildRTCConfiguration(config: PeerConnectionConfig): RTCConfiguration {
    const iceServers: RTCIceServer[] = []

    // Add STUN servers
    if (config.stunServers && config.stunServers.length > 0) {
      iceServers.push(...config.stunServers.map(server => ({ urls: server.urls })))
    } else {
      // Default STUN servers
      iceServers.push(
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      )
    }

    // Add TURN servers
    if (config.turnServers && config.turnServers.length > 0) {
      iceServers.push(...config.turnServers.map(server => ({
        urls: server.urls,
        ...(server.username && { username: server.username }),
        ...(server.credential && { credential: server.credential })
      })))
    }

    return {
      iceServers,
      iceTransportPolicy: config.iceTransportPolicy || 'all',
      bundlePolicy: config.bundlePolicy || 'balanced',
      rtcpMuxPolicy: config.rtcpMuxPolicy || 'require'
    }
  }

  /**
   * Initialize peer connection
   */
  initialize(events: Partial<PeerConnectionEvents>): void {
    this.events = events

    try {
      this.peerConnection = new RTCPeerConnection(this.config)
      this.setupEventHandlers()
      logger.info('Peer connection initialized')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize peer connection', err)
      this.events.onError?.(err)
      throw err
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.peerConnection) {
      return
    }

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (isTruthy(this.peerConnection)) {
        const state = this.peerConnection.connectionState
        logger.debug('Connection state changed', { state })
        this.events.onConnectionStateChange?.(state)
      }
    }

    // ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      if (isTruthy(this.peerConnection)) {
        const state = this.peerConnection.iceConnectionState
        logger.debug('ICE connection state changed', { state })
        this.events.onIceConnectionStateChange?.(state)

        // Handle connection failures
        if (state === 'failed' || state === 'disconnected') {
          logger.warn('ICE connection failed or disconnected', { state })
        }
      }
    }

    // ICE gathering state changes
    this.peerConnection.onicegatheringstatechange = () => {
      if (isTruthy(this.peerConnection)) {
        const state = this.peerConnection.iceGatheringState
        logger.debug('ICE gathering state changed', { state })
        this.events.onIceGatheringStateChange?.(state)
      }
    }

    // ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (isTruthy(event.candidate)) {
        logger.debug('ICE candidate received', { candidate: event.candidate.candidate })
        this.events.onIceCandidate?.(event.candidate)
      } else {
        logger.debug('ICE gathering complete')
      }
    }

    // Remote tracks
    this.peerConnection.ontrack = (event) => {
      logger.debug('Remote track received', {
        trackKind: event.track.kind,
        streamId: event.streams[0]?.id
      })
      this.events.onTrack?.(event)

      // Store remote stream
      if (event.streams.length > 0) {
        this.remoteStreams.set(event.streams[0].id, event.streams[0])
      }
    }

    // ICE candidate errors
    this.peerConnection.onicecandidateerror = (event) => {
      logger.warn('ICE candidate error', {
        errorText: event.errorText,
        errorCode: event.errorCode,
        url: event.url
      })
    }
  }

  /**
   * Add local media stream
   */
  async addLocalStream(stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    this.localStream = stream

    // Add all tracks from stream
    for (const track of stream.getTracks()) {
      this.peerConnection.addTrack(track, stream)
      logger.debug('Added local track', { kind: track.kind, enabled: track.enabled })
    }
  }

  /**
   * Remove local media stream
   */
  removeLocalStream(): void {
    if (!this.peerConnection || !this.localStream) {
      return
    }

    // Remove all tracks
    for (const sender of this.peerConnection.getSenders()) {
      if (isTruthy(sender.track)) {
        sender.track.stop()
        this.peerConnection.removeTrack(sender)
      }
    }

    // Stop all tracks in stream
    for (const track of this.localStream.getTracks()) {
      track.stop()
    }

    this.localStream = null
    logger.debug('Removed local stream')
  }

  /**
   * Create offer
   */
  async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      const offer = await this.peerConnection.createOffer(options)
      await this.peerConnection.setLocalDescription(offer)
      logger.debug('Created offer', { type: offer.type })
      return offer
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create offer', err)
      this.events.onError?.(err)
      throw err
    }
  }

  /**
   * Create answer
   */
  async createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      const answer = await this.peerConnection.createAnswer(options)
      await this.peerConnection.setLocalDescription(answer)
      logger.debug('Created answer', { type: answer.type })
      return answer
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create answer', err)
      this.events.onError?.(err)
      throw err
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      await this.peerConnection.setRemoteDescription(description)
      logger.debug('Set remote description', { type: description.type })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to set remote description', err)
      this.events.onError?.(err)
      throw err
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      await this.peerConnection.addIceCandidate(candidate)
      logger.debug('Added ICE candidate', { candidate: candidate.candidate })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn('Failed to add ICE candidate', err)
      // Don't throw - ICE candidate errors are often non-fatal
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }

  /**
   * Get ICE connection state
   */
  getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState || null
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Get remote streams
   */
  getRemoteStreams(): MediaStream[] {
    return Array.from(this.remoteStreams.values())
  }

  /**
   * Mute/unmute audio track
   */
  setAudioEnabled(enabled: boolean): void {
    if (!this.localStream) {
      return
    }

    for (const track of this.localStream.getAudioTracks()) {
      track.enabled = enabled
      logger.debug('Audio track enabled state changed', { enabled, trackId: track.id })
    }
  }

  /**
   * Enable/disable video track
   */
  setVideoEnabled(enabled: boolean): void {
    if (!this.localStream) {
      return
    }

    for (const track of this.localStream.getVideoTracks()) {
      track.enabled = enabled
      logger.debug('Video track enabled state changed', { enabled, trackId: track.id })
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) {
      return null
    }

    try {
      return await this.peerConnection.getStats()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn('Failed to get statistics', err)
      return null
    }
  }

  /**
   * Close connection and cleanup
   */
  async close(): Promise<void> {
    // Remove local stream
    this.removeLocalStream()

    // Close peer connection
    if (isTruthy(this.peerConnection)) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    // Clear remote streams
    this.remoteStreams.clear()

    // Clear events
    this.events = {}

    logger.info('Peer connection closed and cleaned up')
  }
}
