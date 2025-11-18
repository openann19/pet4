/**
 * High-level live streaming hook combining WebRTC and quality management
 *
 * Features:
 * - Complete streaming solution with camera/screen capture
 * - Automatic quality adaptation
 * - Recording capabilities
 * - Chat/data channel integration
 * - Viewer count tracking
 * - Stream health monitoring
 * - Reconnection handling
 * - Multi-viewer support via SFU/MCU
 *
 * @example
 * ```tsx
 * const stream = useLiveStream({
 *   onViewerJoin: (viewerId) => updateViewers(viewerId),
 *   onStreamEnd: () => cleanup(),
 *   enableRecording: true,
 *   enableChat: true
 * });
 *
 * // Start streaming
 * await stream.startStream({ video: true, audio: true });
 *
 * // Send chat message
 * stream.sendChatMessage('Hello viewers!');
 *
 * // Stop streaming
 * stream.stopStream();
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebRTC } from './use-webrtc';
import { useStreamQuality } from './use-stream-quality';

// ============================================================================
// Types
// ============================================================================

export interface LiveStreamConfig {
  readonly streamId?: string;
  readonly userId?: string;
  readonly onViewerJoin?: (viewerId: string) => void;
  readonly onViewerLeave?: (viewerId: string) => void;
  readonly onChatMessage?: (message: ChatMessage) => void;
  readonly onStreamEnd?: () => void;
  readonly onError?: (error: Error) => void;
  readonly enableRecording?: boolean;
  readonly enableChat?: boolean;
  readonly enableQualityAdaptation?: boolean;
  readonly maxViewers?: number;
}

export interface StreamMediaConfig {
  readonly video?: boolean | MediaTrackConstraints;
  readonly audio?: boolean | MediaTrackConstraints;
  readonly screenShare?: boolean;
}

export interface ChatMessage {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly message: string;
  readonly timestamp: number;
}

export interface StreamViewer {
  readonly id: string;
  readonly joinedAt: number;
  readonly quality: string;
}

export interface LiveStreamState {
  readonly isStreaming: boolean;
  readonly isRecording: boolean;
  readonly viewers: readonly StreamViewer[];
  readonly viewerCount: number;
  readonly streamDuration: number;
  readonly chatMessages: readonly ChatMessage[];
  readonly streamHealth: 'excellent' | 'good' | 'fair' | 'poor';
  readonly bytesTransmitted: number;
}

export interface RecordingOptions {
  readonly mimeType?: string;
  readonly videoBitsPerSecond?: number;
  readonly audioBitsPerSecond?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_VIEWERS = 1000;
const STREAM_HEALTH_CHECK_INTERVAL = 2000;
const DURATION_UPDATE_INTERVAL = 1000;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useLiveStream(config: LiveStreamConfig) {
  const {
    streamId = `stream-${Date.now()}`,
    userId = 'anonymous',
    onViewerJoin,
    onViewerLeave,
    onChatMessage,
    onStreamEnd,
    onError,
    enableRecording = false,
    enableChat = true,
    enableQualityAdaptation = true,
    maxViewers = DEFAULT_MAX_VIEWERS,
  } = config;

  // State
  const [state, setState] = useState<LiveStreamState>({
    isStreaming: false,
    isRecording: false,
    viewers: [],
    viewerCount: 0,
    streamDuration: 0,
    chatMessages: [],
    streamHealth: 'good',
    bytesTransmitted: 0,
  });

  // Refs
  const streamStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const healthCheckIntervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  // WebRTC and Quality hooks
  const webrtc = useWebRTC({
    onRemoteStream: (_stream) => {
      // Handle remote streams (for peer viewing)
    },
    onDataChannel: (channel) => {
      if (enableChat) {
        setupChatChannel(channel);
      }
    },
    onConnectionStateChange: (state) => {
      if (state === 'failed' || state === 'disconnected') {
        handleConnectionLoss();
      }
    },
    onIceCandidate: (candidate) => {
      // Send to signaling server
      broadcastIceCandidate(candidate);
    },
    onError,
    enableDataChannel: enableChat,
    enableSimulcast: enableQualityAdaptation,
  });

  const quality = useStreamQuality({
    onQualityChange: (level) => {
      // Adjust stream quality
      adjustStreamQuality(level);
    },
    onBuffering: (isBuffering) => {
      if (isBuffering) {
        setState((prev) => ({ ...prev, streamHealth: 'poor' }));
      }
    },
    enableAdaptive: enableQualityAdaptation,
  });

  // ============================================================================
  // Stream Control
  // ============================================================================

  const startStream = useCallback(
    async (mediaConfig: StreamMediaConfig = { video: true, audio: true }) => {
      try {
        let stream: MediaStream;

        if (mediaConfig.screenShare) {
          // Screen sharing
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: mediaConfig.video ?? true,
            audio: mediaConfig.audio ?? false,
          });
        } else {
          // Camera/microphone
          const preset = quality.getQualityPreset();
          const videoConstraints: MediaTrackConstraints = {
            width: { ideal: preset?.width ?? 1280 },
            height: { ideal: preset?.height ?? 720 },
            frameRate: { ideal: preset?.frameRate ?? 30 },
            ...(typeof mediaConfig.video === 'object' ? mediaConfig.video : {}),
          };

          stream = await navigator.mediaDevices.getUserMedia({
            video: mediaConfig.video ? videoConstraints : false,
            audio: mediaConfig.audio ?? false,
          });
        }

        localStreamRef.current = stream;

        // Add stream to WebRTC
        webrtc.addStream(stream);

        // Create offer for viewers
        await webrtc.createOffer();

        streamStartTimeRef.current = Date.now();

        setState((prev) => ({
          ...prev,
          isStreaming: true,
        }));

        // Start duration tracking
        durationIntervalRef.current = window.setInterval(() => {
          if (streamStartTimeRef.current) {
            const duration = Date.now() - streamStartTimeRef.current;
            setState((prev) => ({ ...prev, streamDuration: duration }));
          }
        }, DURATION_UPDATE_INTERVAL);

        // Start health monitoring
        healthCheckIntervalRef.current = window.setInterval(() => {
          void checkStreamHealth();
        }, STREAM_HEALTH_CHECK_INTERVAL);

        // Start recording if enabled
        if (enableRecording) {
          startRecording(stream);
        }
      } catch (_error) {
        if (onError) {
          onError(_error as Error);
        }
        throw _error;
      }
    },
    [webrtc, quality, enableRecording, onError]
  );

  const stopStream = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }

    // Stop recording
    if (state.isRecording) {
      stopRecording();
    }

    // Clear intervals
    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (healthCheckIntervalRef.current !== null) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }

    // Close WebRTC
    webrtc.close();

    streamStartTimeRef.current = null;

    setState({
      isStreaming: false,
      isRecording: false,
      viewers: [],
      viewerCount: 0,
      streamDuration: 0,
      chatMessages: [],
      streamHealth: 'good',
      bytesTransmitted: 0,
    });

    if (onStreamEnd) {
      onStreamEnd();
    }
  }, [state.isRecording, webrtc, onStreamEnd]);

  // ============================================================================
  // Recording
  // ============================================================================

  const startRecording = useCallback(
    (stream: MediaStream, options: RecordingOptions = {}) => {
      const {
        mimeType = 'video/webm;codecs=vp9',
        videoBitsPerSecond = 2500000,
        audioBitsPerSecond = 128000,
      } = options;

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // Collect data every second

      mediaRecorderRef.current = recorder;

      setState((prev) => ({ ...prev, isRecording: true }));
    },
    []
  );

  const stopRecording = useCallback((): Blob | null => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;

    recorder.stop();

    // Create blob from recorded chunks
    const blob = new Blob(recordedChunksRef.current, {
      type: 'video/webm',
    });

    // Download recording
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-${streamId}-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);

    recordedChunksRef.current = [];
    mediaRecorderRef.current = null;

    setState((prev) => ({ ...prev, isRecording: false }));

    return blob;
  }, [streamId]);

  // ============================================================================
  // Chat
  // ============================================================================

  const setupChatChannel = useCallback(
    (channel: RTCDataChannel) => {
      channel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as ChatMessage;

          setState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages, message],
          }));

          if (onChatMessage) {
            onChatMessage(message);
          }
        } catch {
          // Ignore invalid messages
        }
      };
    },
    [onChatMessage]
  );

  const sendChatMessage = useCallback(
    (messageText: string) => {
      if (!enableChat || !webrtc.dataChannel) {
        throw new Error('Chat is not enabled');
      }

      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        userId,
        userName: 'Streamer', // Would fetch from user profile
        message: messageText,
        timestamp: Date.now(),
      };

      webrtc.sendData(JSON.stringify(message));

      // Add to own messages
      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, message],
      }));
    },
    [enableChat, userId, webrtc]
  );

  // ============================================================================
  // Viewer Management
  // ============================================================================

  const addViewer = useCallback(
    (viewerId: string) => {
      if (state.viewerCount >= maxViewers) {
        throw new Error('Maximum viewers reached');
      }

      const viewer: StreamViewer = {
        id: viewerId,
        joinedAt: Date.now(),
        quality: quality.state.currentQuality,
      };

      setState((prev) => ({
        ...prev,
        viewers: [...prev.viewers, viewer],
        viewerCount: prev.viewerCount + 1,
      }));

      if (onViewerJoin) {
        onViewerJoin(viewerId);
      }
    },
    [state.viewerCount, maxViewers, quality.state.currentQuality, onViewerJoin]
  );

  const removeViewer = useCallback(
    (viewerId: string) => {
      setState((prev) => ({
        ...prev,
        viewers: prev.viewers.filter((v) => v.id !== viewerId),
        viewerCount: Math.max(0, prev.viewerCount - 1),
      }));

      if (onViewerLeave) {
        onViewerLeave(viewerId);
      }
    },
    [onViewerLeave]
  );

  // ============================================================================
  // Stream Health
  // ============================================================================

  const checkStreamHealth = useCallback(async () => {
    const stats = await webrtc.getStats();
    const networkStats = quality.getNetworkStats();

    if (!stats || !networkStats) return;

    // Determine health based on multiple factors
    let health: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

    if (networkStats.packetLoss > 5) {
      health = 'poor';
    } else if (networkStats.packetLoss > 2) {
      health = 'fair';
    } else if (networkStats.latency < 50 && stats.packetLoss === 0) {
      health = 'excellent';
    }

    setState((prev) => ({
      ...prev,
      streamHealth: health,
      bytesTransmitted: prev.bytesTransmitted + stats.bitrate / 8 / 1000, // Convert to KB
    }));
  }, [webrtc, quality]);

  const adjustStreamQuality = useCallback(
    (level: string) => {
      // Adjust encoding parameters based on quality level
      const preset = quality.getQualityPreset(level as 'low' | 'medium' | 'high' | 'ultra' | 'auto');
      if (!preset || !localStreamRef.current) return;

      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        void videoTrack.applyConstraints({
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: preset.frameRate },
        });
      }
    },
    [quality]
  );

  const handleConnectionLoss = useCallback(() => {
    setState((prev) => ({ ...prev, streamHealth: 'poor' }));

    // Attempt reconnection after delay
    setTimeout(() => {
      if (state.isStreaming && localStreamRef.current) {
        webrtc.addStream(localStreamRef.current);
      }
    }, 3000);
  }, [state.isStreaming, webrtc]);

  // ============================================================================
  // Signaling (Placeholder)
  // ============================================================================

  const broadcastIceCandidate = useCallback((_candidate: RTCIceCandidate) => {
    // In production, send to signaling server
    // For now, placeholder for WebSocket/HTTP signaling
  }, []);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (state.isStreaming) {
        stopStream();
      }
    };
  }, [state.isStreaming, stopStream]);

  return {
    startStream,
    stopStream,
    startRecording,
    stopRecording,
    sendChatMessage,
    addViewer,
    removeViewer,
    setQuality: quality.setQuality,
    state,
    webrtcState: webrtc.state,
    qualityState: quality.state,
    localStream: localStreamRef.current,
  };
}
