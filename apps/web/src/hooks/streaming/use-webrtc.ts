/**
 * WebRTC peer connection management with automatic reconnection
 *
 * Features:
 * - Peer-to-peer video/audio streaming
 * - ICE candidate management
 * - Automatic reconnection on failure
 * - Connection quality monitoring
 * - TURN/STUN server configuration
 * - Data channel support
 * - Simulcast for adaptive streaming
 * - Network bandwidth estimation
 *
 * @example
 * ```tsx
 * const webrtc = useWebRTC({
 *   onRemoteStream: (stream) => setRemoteVideo(stream),
 *   onConnectionStateChange: (state) => updateUI(state),
 *   iceServers: [
 *     { urls: 'stun:stun.l.google.com:19302' }
 *   ]
 * });
 *
 * // Start streaming
 * await webrtc.createOffer();
 *
 * // Handle incoming offer
 * await webrtc.handleOffer(offer);
 *
 * // Add local stream
 * webrtc.addStream(localStream);
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface WebRTCConfig {
  readonly iceServers?: readonly RTCIceServer[];
  readonly onRemoteStream?: (stream: MediaStream) => void;
  readonly onDataChannel?: (channel: RTCDataChannel) => void;
  readonly onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  readonly onIceCandidate?: (candidate: RTCIceCandidate) => void;
  readonly onError?: (error: Error) => void;
  readonly enableDataChannel?: boolean;
  readonly enableSimulcast?: boolean;
  readonly maxReconnectAttempts?: number;
}

export interface WebRTCState {
  readonly connectionState: RTCPeerConnectionState;
  readonly iceConnectionState: RTCIceConnectionState;
  readonly iceGatheringState: RTCIceGatheringState;
  readonly signalingState: RTCSignalingState;
  readonly hasRemoteStream: boolean;
  readonly hasLocalStream: boolean;
  readonly reconnectAttempts: number;
  readonly stats: ConnectionStats | null;
}

export interface ConnectionStats {
  readonly bitrate: number;
  readonly packetLoss: number;
  readonly jitter: number;
  readonly roundTripTime: number;
  readonly timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ICE_SERVERS: readonly RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000;
const STATS_INTERVAL = 1000;

const RTC_CONFIGURATION: RTCConfiguration = {
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWebRTC(config: WebRTCConfig) {
  const {
    iceServers = DEFAULT_ICE_SERVERS,
    onRemoteStream,
    onDataChannel,
    onConnectionStateChange,
    onIceCandidate,
    onError,
    enableDataChannel = false,
    enableSimulcast = false,
    maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS,
  } = config;

  // State
  const [state, setState] = useState<WebRTCState>({
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'new',
    signalingState: 'stable',
    hasRemoteStream: false,
    hasLocalStream: false,
    reconnectAttempts: 0,
    stats: null,
  });

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const statsIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidate[]>([]);

  // ============================================================================
  // Peer Connection Setup
  // ============================================================================

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      ...RTC_CONFIGURATION,
      iceServers: iceServers as RTCIceServer[],
    });

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      setState((prev) => ({
        ...prev,
        connectionState: pc.connectionState,
      }));

      if (onConnectionStateChange) {
        onConnectionStateChange(pc.connectionState);
      }

      // Handle reconnection
      if (pc.connectionState === 'failed') {
        handleConnectionFailure();
      }
    };

    pc.oniceconnectionstatechange = () => {
      setState((prev) => ({
        ...prev,
        iceConnectionState: pc.iceConnectionState,
      }));
    };

    pc.onicegatheringstatechange = () => {
      setState((prev) => ({
        ...prev,
        iceGatheringState: pc.iceGatheringState,
      }));
    };

    pc.onsignalingstatechange = () => {
      setState((prev) => ({
        ...prev,
        signalingState: pc.signalingState,
      }));
    };

    // Remote stream handling
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        remoteStreamRef.current = remoteStream;
        setState((prev) => ({ ...prev, hasRemoteStream: true }));

        if (onRemoteStream) {
          onRemoteStream(remoteStream);
        }
      }
    };

    // Data channel handling
    pc.ondatachannel = (event) => {
      dataChannelRef.current = event.channel;
      setupDataChannelListeners(event.channel);

      if (onDataChannel) {
        onDataChannel(event.channel);
      }
    };

    peerConnectionRef.current = pc;

    return pc;
  }, [iceServers, onIceCandidate, onConnectionStateChange, onRemoteStream, onDataChannel]);

  // ============================================================================
  // Connection Failure Handling
  // ============================================================================

  const handleConnectionFailure = useCallback(() => {
    setState((prev) => {
      if (prev.reconnectAttempts >= maxReconnectAttempts) {
        if (onError) {
          onError(new Error('Max reconnection attempts reached'));
        }
        return prev;
      }

      // Schedule reconnection
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = window.setTimeout(() => {
        createPeerConnection();
        // Re-add local stream if it exists
        if (localStreamRef.current) {
          addStream(localStreamRef.current);
        }
      }, RECONNECT_DELAY);

      return {
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
      };
    });
  }, [maxReconnectAttempts, onError, createPeerConnection]);

  // ============================================================================
  // Stream Management
  // ============================================================================

  const addStream = useCallback((stream: MediaStream) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    localStreamRef.current = stream;

    // Add all tracks to peer connection
    for (const track of stream.getTracks()) {
      const sender = pc.addTrack(track, stream);

      // Enable simulcast if requested
      if (enableSimulcast && track.kind === 'video') {
        const params = sender.getParameters();
        if (!params.encodings) {
          params.encodings = [];
        }

        // Configure simulcast layers
        params.encodings = [
          { rid: 'h', maxBitrate: 900000 }, // High quality
          { rid: 'm', maxBitrate: 300000, scaleResolutionDownBy: 2 }, // Medium
          { rid: 'l', maxBitrate: 100000, scaleResolutionDownBy: 4 }, // Low
        ];

        sender.setParameters(params).catch((error) => {
          if (onError) {
            onError(error as Error);
          }
        });
      }
    }

    setState((prev) => ({ ...prev, hasLocalStream: true }));
  }, [enableSimulcast, onError]);

  const removeStream = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    // Remove all senders
    const senders = pc.getSenders();
    for (const sender of senders) {
      pc.removeTrack(sender);
    }

    localStreamRef.current = null;
    setState((prev) => ({ ...prev, hasLocalStream: false }));
  }, []);

  // ============================================================================
  // Signaling
  // ============================================================================

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit> => {
    const pc = peerConnectionRef.current ?? createPeerConnection();

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await pc.setLocalDescription(offer);

    return offer;
  }, [createPeerConnection]);

  const createAnswer = useCallback(async (): Promise<RTCSessionDescriptionInit> => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return answer;
  }, []);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
      const pc = peerConnectionRef.current ?? createPeerConnection();

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Add any queued ICE candidates
      for (const candidate of iceCandidatesQueueRef.current) {
        await pc.addIceCandidate(candidate);
      }
      iceCandidatesQueueRef.current = [];

      const answer = await createAnswer();
      return answer;
    },
    [createPeerConnection, createAnswer]
  );

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit): Promise<void> => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Add any queued ICE candidates
    for (const candidate of iceCandidatesQueueRef.current) {
      await pc.addIceCandidate(candidate);
    }
    iceCandidatesQueueRef.current = [];
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    const iceCandidate = new RTCIceCandidate(candidate);

    // Queue candidates if remote description not set
    if (pc.remoteDescription) {
      await pc.addIceCandidate(iceCandidate);
    } else {
      iceCandidatesQueueRef.current.push(iceCandidate);
    }
  }, []);

  // ============================================================================
  // Data Channel
  // ============================================================================

  const createDataChannel = useCallback((label: string): RTCDataChannel => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    const channel = pc.createDataChannel(label, {
      ordered: true,
      maxRetransmits: 3,
    });

    dataChannelRef.current = channel;
    setupDataChannelListeners(channel);

    return channel;
  }, []);

  const setupDataChannelListeners = useCallback((channel: RTCDataChannel) => {
    channel.onopen = () => {
      // Channel ready
    };

    channel.onclose = () => {
      // Channel closed
    };

    channel.onerror = (error) => {
      if (onError) {
        onError(new Error(`Data channel error: ${error}`));
      }
    };
  }, [onError]);

  const sendData = useCallback((data: string | Blob | ArrayBuffer): void => {
    const channel = dataChannelRef.current;
    if (channel?.readyState !== 'open') {
      throw new Error('Data channel not open');
    }

    // RTCDataChannel.send() runtime accepts these types even if TypeScript is strict
    channel.send(data as never);
  }, []);

  // ============================================================================
  // Statistics
  // ============================================================================

  const getStats = useCallback(async (): Promise<ConnectionStats | null> => {
    const pc = peerConnectionRef.current;
    if (!pc) return null;

    const stats = await pc.getStats();
    let bitrate = 0;
    let packetLoss = 0;
    let jitter = 0;
    let roundTripTime = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        bitrate = (report.bytesReceived ?? 0) * 8; // bits per second
        packetLoss = report.packetsLost ?? 0;
        jitter = report.jitter ?? 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime ?? 0;
      }
    });

    return {
      bitrate,
      packetLoss,
      jitter,
      roundTripTime: roundTripTime * 1000, // Convert to ms
      timestamp: Date.now(),
    };
  }, []);

  // ============================================================================
  // Cleanup
  // ============================================================================

  const close = useCallback(() => {
    if (statsIntervalRef.current !== null) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    iceCandidatesQueueRef.current = [];

    setState({
      connectionState: 'closed',
      iceConnectionState: 'closed',
      iceGatheringState: 'complete',
      signalingState: 'closed',
      hasRemoteStream: false,
      hasLocalStream: false,
      reconnectAttempts: 0,
      stats: null,
    });
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize peer connection
  useEffect(() => {
    createPeerConnection();

    // Create data channel if enabled
    if (enableDataChannel) {
      createDataChannel('data');
    }

    return () => {
      close();
    };
  }, [createPeerConnection, enableDataChannel, createDataChannel, close]);

  // Statistics monitoring
  useEffect(() => {
    statsIntervalRef.current = window.setInterval(() => {
      void getStats().then((stats) => {
        if (stats) {
          setState((prev) => ({ ...prev, stats }));
        }
      });
    }, STATS_INTERVAL);

    return () => {
      if (statsIntervalRef.current !== null) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [getStats]);

  return {
    addStream,
    removeStream,
    createOffer,
    createAnswer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    createDataChannel,
    sendData,
    getStats,
    close,
    state,
    peerConnection: peerConnectionRef.current,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    dataChannel: dataChannelRef.current,
  };
}
