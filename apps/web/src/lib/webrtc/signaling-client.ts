/**
 * WebRTC Signaling Client
 *
 * Handles WebRTC signaling via WebSocket:
 * - Sending/receiving offers, answers, and ICE candidates
 * - Connection management
 * - Error handling and reconnection
 */

import { createLogger } from '@/lib/logger';
import type { RealtimeClient } from '@/lib/realtime';
import type { RTCSessionDescriptionInit, RTCIceCandidateInit } from './webrtc-types';

const logger = createLogger('SignalingClient');

export interface SignalingEvents {
  onOffer: (offer: RTCSessionDescriptionInit, from: string, callId: string) => void | Promise<void>;
  onAnswer: (
    answer: RTCSessionDescriptionInit,
    from: string,
    callId: string
  ) => void | Promise<void>;
  onIceCandidate: (
    candidate: RTCIceCandidateInit,
    from: string,
    callId: string
  ) => void | Promise<void>;
  onCallEnd: (from: string, callId: string) => void | Promise<void>;
  onError: (error: Error) => void;
}

export class SignalingClient {
  private realtimeClient: RealtimeClient;
  private events: Partial<SignalingEvents> = {};
  private isListening = false;

  constructor(realtimeClient: RealtimeClient) {
    this.realtimeClient = realtimeClient;
  }

  /**
   * Initialize signaling with event handlers
   */
  initialize(events: Partial<SignalingEvents>): void {
    this.events = events;

    if (!this.isListening) {
      this.setupEventHandlers();
      this.isListening = true;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    // Listen for WebRTC signaling events
    this.realtimeClient.on('webrtc:signal', (payload: unknown) => {
      const data = payload as {
        type: 'offer' | 'answer' | 'candidate' | 'end';
        from: string;
        to: string;
        callId: string;
        data?: unknown;
      };
      try {
        switch (data.type) {
          case 'offer':
            if (data.data) {
              void this.events.onOffer?.(
                data.data as RTCSessionDescriptionInit,
                data.from,
                data.callId
              );
            }
            break;
          case 'answer':
            if (data.data) {
              void this.events.onAnswer?.(
                data.data as RTCSessionDescriptionInit,
                data.from,
                data.callId
              );
            }
            break;
          case 'candidate':
            if (data.data) {
              void this.events.onIceCandidate?.(
                data.data as RTCIceCandidateInit,
                data.from,
                data.callId
              );
            }
            break;
          case 'end':
            void this.events.onCallEnd?.(data.from, data.callId);
            break;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error handling signaling event', err, { type: data.type });
        this.events.onError?.(err);
      }
    });
  }

  /**
   * Send offer
   */
  sendOffer(offer: RTCSessionDescriptionInit, to: string, callId: string): void {
    try {
      void this.realtimeClient.emit('webrtc:signal', {
        type: 'offer',
        from: 'current-user', // Should be replaced with actual user ID
        to,
        callId,
        data: offer,
      });
      logger.debug('Sent offer', { to, callId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send offer', err);
      this.events.onError?.(err);
    }
  }

  /**
   * Send answer
   */
  sendAnswer(answer: RTCSessionDescriptionInit, to: string, callId: string): void {
    try {
      void this.realtimeClient.emit('webrtc:signal', {
        type: 'answer',
        from: 'current-user', // Should be replaced with actual user ID
        to,
        callId,
        data: answer,
      });
      logger.debug('Sent answer', { to, callId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send answer', err);
      this.events.onError?.(err);
    }
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(candidate: RTCIceCandidateInit, to: string, callId: string): void {
    try {
      void this.realtimeClient.emit('webrtc:signal', {
        type: 'candidate',
        from: 'current-user', // Should be replaced with actual user ID
        to,
        callId,
        data: candidate,
      });
      logger.debug('Sent ICE candidate', { to, callId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send ICE candidate', err);
      this.events.onError?.(err);
    }
  }

  /**
   * Send call end
   */
  sendCallEnd(to: string, callId: string): void {
    try {
      void this.realtimeClient.emit('webrtc:signal', {
        type: 'end',
        from: 'current-user', // Should be replaced with actual user ID
        to,
        callId,
      });
      logger.debug('Sent call end', { to, callId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send call end', err);
      this.events.onError?.(err);
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.events = {};
    this.isListening = false;
  }
}
