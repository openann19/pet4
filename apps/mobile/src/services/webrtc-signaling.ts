/**
 * WebRTC Signaling Service
 *
 * Bridges RealtimeClient with useWebRTC's onSignalingData callback
 * Handles offer/answer/candidate events and sends signaling data via RealtimeClient
 * Location: apps/mobile/src/services/webrtc-signaling.ts
 */

import { createLogger } from '@/utils/logger'
import { realtime, type WebRTCSignalData } from '@/lib/realtime'
import type {
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
} from '@/types/webrtc'

const logger = createLogger('webrtc-signaling')

export interface SignalingData {
  type: 'offer' | 'answer' | 'candidate'
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

export interface SignalingCallbacks {
  onSignalingData: (data: SignalingData) => void
  onError?: (error: Error) => void
}

export interface WebRTCSignalingServiceOptions {
  callId: string
  localUserId: string
  remoteUserId: string
  onSignalingData: (data: SignalingData) => void
  onError: ((error: Error) => void) | undefined
}

/**
 * WebRTC Signaling Service
 * Manages signaling between peers via RealtimeClient
 */
export class WebRTCSignalingService {
  private callId: string
  private localUserId: string
  private remoteUserId: string
  private onSignalingData: (data: SignalingData) => void
  private onError: ((error: Error) => void) | undefined
  private unsubscribe: (() => void) | null = null
  private isInitialized = false

  constructor(options: WebRTCSignalingServiceOptions) {
    this.callId = options.callId
    this.localUserId = options.localUserId
    this.remoteUserId = options.remoteUserId
    this.onSignalingData = options.onSignalingData
    this.onError = options.onError
  }

  /**
   * Initialize signaling service
   * Sets up event listeners for incoming signaling data
   */
  initialize(): void {
    if (this.isInitialized) {
      logger.warn('Signaling service already initialized', { callId: this.callId })
      return
    }

    try {
      // Subscribe to WebRTC signaling events
      this.unsubscribe = realtime.onWebRTCSignal(
        this.callId,
        this.localUserId,
        (signal: WebRTCSignalData) => {
          this.handleIncomingSignal(signal)
        }
      )

      this.isInitialized = true
      logger.info('Signaling service initialized', {
        callId: this.callId,
        localUserId: this.localUserId,
        remoteUserId: this.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize signaling service', err, {
        callId: this.callId,
      })
      this.onError?.(err)
    }
  }

  /**
   * Handle incoming signaling data
   */
  private handleIncomingSignal(signal: WebRTCSignalData): void {
    try {
      // Only process signals for this call and from the remote user
      if (
        signal.callId !== this.callId ||
        signal.from !== this.remoteUserId ||
        signal.to !== this.localUserId
      ) {
        return
      }

      logger.info('Received signaling data', {
        callId: this.callId,
        type: signal.type,
        from: signal.from,
      })

      // Map RealtimeClient signal to useWebRTC signaling data format
      const signalingData: SignalingData = {
        type: signal.type as 'offer' | 'answer' | 'candidate',
      }

      if (signal.type === 'offer' || signal.type === 'answer') {
        if (signal.data) {
          signalingData.sdp = signal.data as RTCSessionDescriptionInit
        } else {
          logger.warn('Missing SDP in signal', {
            callId: this.callId,
            type: signal.type,
          })
          return
        }
      } else if (signal.type === 'candidate') {
        if (signal.data) {
          signalingData.candidate = signal.data as RTCIceCandidateInit
        } else {
          logger.warn('Missing candidate in signal', {
            callId: this.callId,
            type: signal.type,
          })
          return
        }
      }

      // Pass signaling data to useWebRTC hook
      this.onSignalingData(signalingData)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to handle incoming signal', err, {
        callId: this.callId,
        type: signal.type,
      })
      this.onError?.(err)
    }
  }

  /**
   * Send offer to remote peer
   */
  async sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const signalData: WebRTCSignalData = {
        type: 'offer',
        from: this.localUserId,
        to: this.remoteUserId,
        callId: this.callId,
        data: offer,
      }

      const result = await realtime.emitWebRTCSignal(signalData)
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to send offer')
      }

      logger.info('Sent offer', {
        callId: this.callId,
        to: this.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to send offer', err, {
        callId: this.callId,
        to: this.remoteUserId,
      })
      this.onError?.(err)
      throw err
    }
  }

  /**
   * Send answer to remote peer
   */
  async sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const signalData: WebRTCSignalData = {
        type: 'answer',
        from: this.localUserId,
        to: this.remoteUserId,
        callId: this.callId,
        data: answer,
      }

      const result = await realtime.emitWebRTCSignal(signalData)
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to send answer')
      }

      logger.info('Sent answer', {
        callId: this.callId,
        to: this.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to send answer', err, {
        callId: this.callId,
        to: this.remoteUserId,
      })
      this.onError?.(err)
      throw err
    }
  }

  /**
   * Send ICE candidate to remote peer
   */
  async sendIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const signalData: WebRTCSignalData = {
        type: 'candidate',
        from: this.localUserId,
        to: this.remoteUserId,
        callId: this.callId,
        data: candidate,
      }

      const result = await realtime.emitWebRTCSignal(signalData)
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to send ICE candidate')
      }

      logger.debug('Sent ICE candidate', {
        callId: this.callId,
        to: this.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to send ICE candidate', err, {
        callId: this.callId,
        to: this.remoteUserId,
      })
      this.onError?.(err)
      throw err
    }
  }

  /**
   * Send call end signal to remote peer
   */
  async sendCallEnd(): Promise<void> {
    try {
      const signalData: WebRTCSignalData = {
        type: 'end',
        from: this.localUserId,
        to: this.remoteUserId,
        callId: this.callId,
      }

      const result = await realtime.emitWebRTCSignal(signalData)
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to send call end')
      }

      logger.info('Sent call end', {
        callId: this.callId,
        to: this.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to send call end', err, {
        callId: this.callId,
        to: this.remoteUserId,
      })
      this.onError?.(err)
      throw err
    }
  }

  /**
   * Cleanup signaling service
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    this.isInitialized = false
    logger.info('Signaling service cleaned up', {
      callId: this.callId,
    })
  }
}
