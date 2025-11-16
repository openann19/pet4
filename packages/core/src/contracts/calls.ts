/**
 * Call API Contracts
 *
 * Shared types and contracts for call signaling and session management
 */

// WebRTC type definitions
export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
}

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'in-call' | 'ended' | 'failed';

export type CallDirection = 'incoming' | 'outgoing';

export type CallKind = 'direct' | 'group';

export type VideoQuality = '4k' | '1080p' | '720p' | '480p';

export interface CallParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isLocal: boolean;
  microphone: 'enabled' | 'muted';
  camera: 'enabled' | 'off';
  isScreenSharing?: boolean;
}

export interface CallSession {
  id: string;
  kind: CallKind;
  direction: CallDirection;
  status: CallStatus;
  localParticipant: CallParticipant;
  remoteParticipant?: CallParticipant;
  participants?: CallParticipant[];
  startedAt: string;
  endedAt?: string;
  failureReason?: string;
}

export interface SignalingConfig {
  baseUrl: string;
  wsUrl?: string;
  token?: string;
}

export interface CallOfferSignal {
  type: 'call-offer';
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
}

export interface CallAnswerSignal {
  type: 'call-answer';
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
}

export interface CallCandidateSignal {
  type: 'call-candidate';
  callId: string;
  fromUserId: string;
  toUserId: string;
  candidate: RTCIceCandidateInit;
}

export interface CallRejectSignal {
  type: 'call-reject';
  callId: string;
  fromUserId: string;
  toUserId: string;
  reason?: string;
}

export interface CallEndSignal {
  type: 'call-end';
  callId: string;
  fromUserId: string;
  toUserId: string;
  reason?: string;
}

export type CallSignal =
  | CallOfferSignal
  | CallAnswerSignal
  | CallCandidateSignal
  | CallRejectSignal
  | CallEndSignal;

export interface CreateCallSessionRequest {
  callId: string;
  kind: CallKind;
  participantIds: string[];
}

export interface CreateCallSessionResponse {
  sessionId: string;
  callId: string;
  kind: CallKind;
  participants: CallParticipant[];
}

export interface JoinCallSessionRequest {
  sessionId: string;
  userId: string;
}

export interface JoinCallSessionResponse {
  sessionId: string;
  callId: string;
  participants: CallParticipant[];
}

/**
 * Call Signaling Client
 *
 * Handles WebRTC signaling via WebSocket or HTTP
 */
export class CallSignalingClient {
  private config: SignalingConfig;
  private ws: WebSocket | null = null;
  private signalHandlers: Set<(signal: CallSignal) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: SignalingConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = this.config.wsUrl ?? `${this.config.baseUrl.replace(/^http/, 'ws')}/calls/signaling`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      if (this.config.token) {
        this.ws?.send(JSON.stringify({ type: 'auth', token: this.config.token }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const signal = JSON.parse(event.data) as CallSignal;
        this.signalHandlers.forEach((handler) => {
          try {
            handler(signal);
          } catch (error) {
            console.error('Error in signal handler', error);
          }
        });
      } catch (error) {
        console.error('Failed to parse signal', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.signalHandlers.clear();
  }

  send(signal: CallSignal): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(signal));
    } else {
      console.warn('WebSocket not connected, cannot send signal', signal);
    }
  }

  onSignal(handler: (signal: CallSignal) => void): () => void {
    this.signalHandlers.add(handler);
    return () => {
      this.signalHandlers.delete(handler);
    };
  }
}

