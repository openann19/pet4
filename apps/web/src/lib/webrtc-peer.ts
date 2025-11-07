/**
 * WebRTC Peer Management
 * 
 * Provides peer-to-peer WebRTC connections using SimplePeer
 * for video calling functionality.
 */

import SimplePeer from 'simple-peer'
import { createLogger } from './logger'
import type { WebRTCSignalData } from './realtime'
import { realtime } from './realtime'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('WebRTCPeer')

export interface PeerConfig {
  callId: string
  localUserId: string
  remoteUserId: string
  isInitiator: boolean
  localStream: MediaStream
  onRemoteStream: (stream: MediaStream) => void
  onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => void
}

/**
 * Get STUN/TURN server configuration from environment or defaults
 */
function getIceServers(): RTCIceServer[] {
  const stunServers: unknown = import.meta.env['VITE_STUN_SERVERS']
  const turnServers: unknown = import.meta.env['VITE_TURN_SERVERS']

  const servers: RTCIceServer[] = []

  if (stunServers && typeof stunServers === 'string') {
    const stunUrls: string[] = stunServers.split(',')
    servers.push(...stunUrls.map((url: string) => ({ urls: url.trim() })))
  } else {
    // Default Google STUN servers
    servers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    )
  }

  if (turnServers && typeof turnServers === 'string') {
    // TURN servers should be in format: url:username:credential
    const turnUrls: string[] = turnServers.split(',')
    turnUrls.forEach((turn: string) => {
      const parts = turn.trim().split(':')
      if (parts.length >= 2) {
        const server: RTCIceServer = {
          urls: parts[0] as string,
          credential: parts[2] || ''
        }
        if (isTruthy(parts[1])) {
          server.username = parts[1]
        }
        servers.push(server)
      }
    })
  }

  return servers
}

/**
 * Create and manage a WebRTC peer connection
 */
export class WebRTCPeer {
  private peer: SimplePeer.Instance | null = null
  private config: PeerConfig
  private cleanupListener: (() => void) | null = null

  constructor(config: PeerConfig) {
    this.config = config
  }

  /**
   * Initialize the peer connection and start signaling
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const iceServers = getIceServers()

        this.peer = new SimplePeer({
          initiator: this.config.isInitiator,
          trickle: true,
          stream: this.config.localStream,
          config: {
            iceServers
          }
        })

        // Handle signaling data (offer/answer/candidate)
        this.peer.on('signal', (signalData: SimplePeer.SignalData) => {
          this.sendSignal(signalData).catch(error => {
            logger.error('Failed to send signal', error instanceof Error ? error : new Error(String(error)), {
              callId: this.config.callId
            })
          })
        })

        // Handle remote stream
        this.peer.on('stream', (remoteStream: MediaStream) => {
          logger.info('Remote stream received', { callId: this.config.callId })
          this.config.onRemoteStream(remoteStream)
        })

        // Handle connection state changes
        this.peer.on('connect', () => {
          logger.info('Peer connection established', { callId: this.config.callId })
          this.config.onConnectionStateChange?.('connected')
          resolve()
        })

        this.peer.on('close', () => {
          logger.info('Peer connection closed', { callId: this.config.callId })
          this.config.onConnectionStateChange?.('disconnected')
        })

        this.peer.on('error', (error: Error) => {
          logger.error('Peer connection error', error, { callId: this.config.callId })
          this.config.onConnectionStateChange?.('failed')
          reject(error)
        })

        // Set up signaling listener
        this.setupSignalingListener()

        // If we're the initiator, the signal event will fire automatically
        // If we're the receiver, we wait for incoming signals
        if (!this.config.isInitiator) {
          this.config.onConnectionStateChange?.('connecting')
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to create peer connection', err, { callId: this.config.callId })
        reject(err)
      }
    })
  }

  /**
   * Send signaling data to the remote peer via realtime service
   */
  private async sendSignal(signalData: SimplePeer.SignalData): Promise<void> {
    const signal: WebRTCSignalData = {
      type: this.determineSignalType(signalData),
      from: this.config.localUserId,
      to: this.config.remoteUserId,
      callId: this.config.callId,
      data: signalData
    }

    const result = await realtime.emitWebRTCSignal(signal)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send signal')
    }
  }

  /**
   * Determine signal type from SimplePeer signal data
   */
  private determineSignalType(signalData: SimplePeer.SignalData): 'offer' | 'answer' | 'candidate' | 'end' {
    if (typeof signalData === 'string') {
      try {
        const parsed: unknown = JSON.parse(signalData)
        if (typeof parsed === 'object' && parsed !== null) {
          const parsedObj = parsed as Record<string, unknown>
          if (parsedObj['type'] === 'offer') return 'offer'
          if (parsedObj['type'] === 'answer') return 'answer'
          if (parsedObj['candidate'] !== undefined) return 'candidate'
        }
      } catch {
        // Fall through
      }
    }

    // Default based on whether we're initiator
    return this.config.isInitiator ? 'offer' : 'answer'
  }

  /**
   * Set up listener for incoming signaling data
   */
  private setupSignalingListener(): void {
    this.cleanupListener = realtime.onWebRTCSignal(
      this.config.callId,
      this.config.localUserId,
      (signal: WebRTCSignalData) => {
        if (signal.from === this.config.remoteUserId && this.peer) {
          try {
            this.peer.signal(signal.data as SimplePeer.SignalData)
            this.config.onConnectionStateChange?.('connecting')
          } catch (error) {
            logger.error('Failed to process incoming signal', error instanceof Error ? error : new Error(String(error)), {
              callId: this.config.callId,
              signalType: signal.type
            })
          }
        }
      }
    )
  }

  /**
   * Replace the local media stream
   * Note: SimplePeer's addStream is deprecated but still functional
   * For production, consider recreating peer connection with new stream
   */
  replaceStream(newStream: MediaStream): void {
    if (!this.peer) return

    try {
      // SimplePeer's replaceStream method
      // This is a simplified implementation - for production, consider recreating the peer
      this.peer.removeStream(this.config.localStream)
      this.peer.addStream(newStream)
      this.config.localStream = newStream
    } catch (error) {
      logger.error('Failed to replace stream', error instanceof Error ? error : new Error(String(error)), {
        callId: this.config.callId
      })
      // If replace fails, log and continue with old stream
    }
  }

  /**
   * Check if peer is connected
   */
  isConnected(): boolean {
    return this.peer !== null && !this.peer.destroyed && this.peer.connected
  }

  /**
   * Destroy the peer connection and clean up
   */
  destroy(): void {
    if (isTruthy(this.cleanupListener)) {
      this.cleanupListener()
      this.cleanupListener = null
    }

    if (isTruthy(this.peer)) {
      try {
        this.peer.destroy()
      } catch (error) {
        logger.error('Error destroying peer', error instanceof Error ? error : new Error(String(error)), {
          callId: this.config.callId
        })
      }
      this.peer = null
    }

    logger.info('Peer connection destroyed', { callId: this.config.callId })
  }
}

/**
 * Create a new WebRTC peer connection
 */
export function createWebRTCPeer(config: PeerConfig): WebRTCPeer {
  return new WebRTCPeer(config)
}
