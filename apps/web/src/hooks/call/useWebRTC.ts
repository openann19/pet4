/**
 * WebRTC Hook
 *
 * Complete WebRTC implementation with:
 * - Real peer connections
 * - Signaling via WebSocket
 * - Media stream management
 * - Connection state management
 * - Error handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { PeerConnectionManager } from '@/lib/webrtc/peer-connection-manager';
import { SignalingClient } from '@/lib/webrtc/signaling-client';
import { mediaStreamManager } from '@/lib/webrtc/media-stream-manager';
import type { RealtimeClient } from '@/lib/realtime';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useWebRTC');

export interface CallState {
  isConnecting: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  error: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export interface UseWebRTCOptions {
  callId: string;
  remoteUserId: string;
  isCaller?: boolean;
  realtimeClient: RealtimeClient;
  stunServers?: { urls: string | string[] }[];
  turnServers?: {
    urls: string | string[];
    username?: string;
    credential?: string;
  }[];
}

export function useWebRTC(options: UseWebRTCOptions) {
  const {
    callId,
    remoteUserId,
    isCaller = false,
    realtimeClient,
    stunServers,
    turnServers,
  } = options;

  const [callState, setCallState] = useState<CallState>({
    isConnecting: true,
    isConnected: false,
    isMuted: false,
    isCameraOn: true,
    error: null,
    localStream: null,
    remoteStream: null,
  });

  const peerConnectionRef = useRef<PeerConnectionManager | null>(null);
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  /**
   * Initialize WebRTC connection
   */
  useEffect(() => {
    let mounted = true;

    async function initialize(): Promise<void> {
      try {
        // Create peer connection manager
        const peerConnection = new PeerConnectionManager({
          stunServers,
          turnServers,
        });

        // Create signaling client
        const signalingClient = new SignalingClient(realtimeClient);

        // Setup peer connection event handlers
        peerConnection.initialize({
          onConnectionStateChange: (state) => {
            if (!mounted) return;

            setCallState((prev) => ({
              ...prev,
              isConnecting: state === 'connecting',
              isConnected: state === 'connected',
              ...(state === 'failed' || state === 'closed'
                ? {
                    error: `Connection ${state}`,
                    isConnecting: false,
                    isConnected: false,
                  }
                : {}),
            }));
          },
          onIceConnectionStateChange: (state) => {
            if (!mounted) return;

            if (state === 'connected' || state === 'completed') {
              setCallState((prev) => ({
                ...prev,
                isConnecting: false,
                isConnected: true,
              }));
            } else if (state === 'failed' || state === 'disconnected') {
              setCallState((prev) => ({
                ...prev,
                error: `ICE connection ${state}`,
                isConnected: false,
              }));
            }
          },
          onIceCandidate: (candidate) => {
            if (!mounted) return;

            signalingClient.sendIceCandidate(candidate.toJSON(), remoteUserId, callId);
          },
          onTrack: (event) => {
            if (!mounted) return;

            const remoteStream = event.streams[0];
            if (remoteStream) {
              setCallState((prev) => ({
                ...prev,
                remoteStream,
              }));
            }
          },
          onError: (error) => {
            if (!mounted) return;

            logger.error('Peer connection error', error);
            setCallState((prev) => ({
              ...prev,
              error: error.message,
            }));
          },
        });

        // Setup signaling client
        signalingClient.initialize({
          onOffer: async (offer) => {
            if (!mounted || !peerConnectionRef.current) return;

            try {
              await peerConnectionRef.current.setRemoteDescription(offer);
              const answer = await peerConnectionRef.current.createAnswer();
              signalingClient.sendAnswer(answer, remoteUserId, callId);
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to handle offer', err);
              setCallState((prev) => ({ ...prev, error: err.message }));
            }
          },
          onAnswer: async (answer) => {
            if (!mounted || !peerConnectionRef.current) return;

            try {
              await peerConnectionRef.current.setRemoteDescription(answer);
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to handle answer', err);
              setCallState((prev) => ({ ...prev, error: err.message }));
            }
          },
          onIceCandidate: async (candidate) => {
            if (!mounted || !peerConnectionRef.current) return;

            try {
              await peerConnectionRef.current.addIceCandidate(candidate);
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.warn('Failed to add ICE candidate', err);
            }
          },
          onCallEnd: () => {
            if (!mounted) return;

            setCallState((prev) => ({
              ...prev,
              isConnected: false,
              isConnecting: false,
            }));
          },
          onError: (error) => {
            if (!mounted) return;

            logger.error('Signaling error', error);
            setCallState((prev) => ({
              ...prev,
              error: error.message,
            }));
          },
        });

        // Get local media stream
        const localStream = await mediaStreamManager.getUserMedia({
          audio: true,
          video: true,
        });

        if (!mounted) {
          mediaStreamManager.stopStream(localStream);
          return;
        }

        localStreamRef.current = localStream;
        await peerConnection.addLocalStream(localStream);

        setCallState((prev) => ({
          ...prev,
          localStream,
        }));

        peerConnectionRef.current = peerConnection;
        signalingClientRef.current = signalingClient;

        // Create offer if caller
        if (isTruthy(isCaller)) {
          try {
            const offer = await peerConnection.createOffer();
            signalingClient.sendOffer(offer, remoteUserId, callId);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to create offer', err);
            setCallState((prev) => ({ ...prev, error: err.message }));
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to initialize WebRTC', err);
        if (mounted) {
          setCallState((prev) => ({
            ...prev,
            error: err.message,
            isConnecting: false,
          }));
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [callId, remoteUserId, isCaller, realtimeClient, stunServers, turnServers]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(async () => {
    // Stop local stream
    if (localStreamRef.current) {
      mediaStreamManager.stopStream(localStreamRef.current);
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Cleanup signaling
    if (signalingClientRef.current) {
      signalingClientRef.current.sendCallEnd(remoteUserId, callId);
      signalingClientRef.current.cleanup();
      signalingClientRef.current = null;
    }
  }, [remoteUserId, callId]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!peerConnectionRef.current || !localStreamRef.current) {
      return;
    }

    const newMutedState = !callState.isMuted;
    peerConnectionRef.current.setAudioEnabled(!newMutedState);
    mediaStreamManager.setAudioEnabled(localStreamRef.current, !newMutedState);

    setCallState((prev) => ({
      ...prev,
      isMuted: newMutedState,
    }));
  }, [callState.isMuted]);

  /**
   * Toggle camera
   */
  const toggleCamera = useCallback(() => {
    if (!peerConnectionRef.current || !localStreamRef.current) {
      return;
    }

    const newCameraState = !callState.isCameraOn;
    peerConnectionRef.current.setVideoEnabled(newCameraState);
    mediaStreamManager.setVideoEnabled(localStreamRef.current, newCameraState);

    setCallState((prev) => ({
      ...prev,
      isCameraOn: newCameraState,
    }));
  }, [callState.isCameraOn]);

  /**
   * End call
   */
  const endCall = useCallback(async () => {
    await cleanup();
    setCallState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));
  }, [cleanup]);

  return {
    callState,
    toggleMute,
    toggleCamera,
    endCall,
  };
}
