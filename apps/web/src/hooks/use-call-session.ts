/**
 * Call Session Hook
 *
 * Manages call session state and WebRTC connection
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CallClient } from '@/lib/calls/call-client';
import type {
  CallSession,
  CallParticipant,
  VideoQuality,
  CallStatus,
} from '@/lib/calls/call-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useCallSession');

export interface UseCallSessionOptions {
  localUserId: string;
  localDisplayName: string;
  localAvatarUrl?: string | null;
  iceServers?: RTCIceServer[];
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export interface UseCallSessionResult {
  session: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  videoQuality: VideoQuality;
  startCall: (params: {
    callId: string;
    remoteUserId: string;
    remoteDisplayName: string;
    remoteAvatarUrl?: string | null;
    quality?: VideoQuality;
  }) => Promise<void>;
  acceptCall: (params: {
    callId: string;
    remoteUserId: string;
    remoteDisplayName: string;
    remoteAvatarUrl?: string | null;
    offer: RTCSessionDescriptionInit;
    quality?: VideoQuality;
  }) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  setVideoQuality: (quality: VideoQuality) => Promise<void>;
}

export function useCallSession(
  options: UseCallSessionOptions
): UseCallSessionResult {
  const {
    localUserId,
    localDisplayName,
    localAvatarUrl,
    iceServers,
    onRemoteStream,
    onConnectionStateChange,
    onError,
  } = options;

  const [session, setSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [videoQuality, setVideoQualityState] = useState<VideoQuality>('720p');

  const clientRef = useRef<CallClient | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new CallClient({
        iceServers,
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
          onRemoteStream?.(stream);
        },
        onConnectionStateChange,
        onError,
      });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
    };
  }, [iceServers, onRemoteStream, onConnectionStateChange, onError]);

  const createLocalParticipant = useCallback(
    (): CallParticipant => ({
      id: localUserId,
      displayName: localDisplayName,
      avatarUrl: localAvatarUrl ?? null,
      isLocal: true,
      microphone: isMuted ? 'muted' : 'enabled',
      camera: isCameraOff ? 'off' : 'enabled',
      isScreenSharing,
    }),
    [localUserId, localDisplayName, localAvatarUrl, isMuted, isCameraOff, isScreenSharing]
  );

  const startCall = useCallback<UseCallSessionResult['startCall']>(
    async ({ callId, remoteUserId, remoteDisplayName, remoteAvatarUrl, quality = '720p' }) => {
      try {
        const client = clientRef.current;
        if (!client) {
          throw new Error('Call client not initialized');
        }

        setVideoQualityState(quality);
        const stream = await client.requestMediaStream(quality);
        setLocalStream(stream);

        const _pc = client.createPeerConnection();
        client.addLocalStream(stream);

        const _offer = await client.createOffer();

        const remoteParticipant: CallParticipant = {
          id: remoteUserId,
          displayName: remoteDisplayName,
          avatarUrl: remoteAvatarUrl ?? null,
          isLocal: false,
          microphone: 'enabled',
          camera: 'enabled',
        };

        const newSession: CallSession = {
          id: callId,
          kind: 'direct',
          direction: 'outgoing',
          status: 'ringing',
          localParticipant: createLocalParticipant(),
          remoteParticipant,
          startedAt: new Date().toISOString(),
        };

        setSession(newSession);

        logger.debug('Call started', { callId, remoteUserId, quality });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to start call', err);
        onError?.(err);
        setSession(null);
      }
    },
    [createLocalParticipant, onError]
  );

  const acceptCall = useCallback<UseCallSessionResult['acceptCall']>(
    async ({ callId, remoteUserId, remoteDisplayName, remoteAvatarUrl, offer, quality = '720p' }) => {
      try {
        const client = clientRef.current;
        if (!client) {
          throw new Error('Call client not initialized');
        }

        setVideoQualityState(quality);
        const stream = await client.requestMediaStream(quality);
        setLocalStream(stream);

        const _pc = client.createPeerConnection();
        client.addLocalStream(stream);

        await client.handleOffer(offer);

        const remoteParticipant: CallParticipant = {
          id: remoteUserId,
          displayName: remoteDisplayName,
          avatarUrl: remoteAvatarUrl ?? null,
          isLocal: false,
          microphone: 'enabled',
          camera: 'enabled',
        };

        const newSession: CallSession = {
          id: callId,
          kind: 'direct',
          direction: 'incoming',
          status: 'connecting',
          localParticipant: createLocalParticipant(),
          remoteParticipant,
          startedAt: new Date().toISOString(),
        };

        setSession(newSession);

        logger.debug('Call accepted', { callId, remoteUserId, quality });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to accept call', err);
        onError?.(err);
        setSession(null);
      }
    },
    [createLocalParticipant, onError]
  );

  const endCall = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      client.close();
    }

    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
      screenShareStreamRef.current = null;
    }

    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'ended',
            endedAt: new Date().toISOString(),
          }
        : null
    );
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, []);

  const toggleMute = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      const newMuted = !isMuted;
      client.toggleMute(newMuted);
      setIsMuted(newMuted);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              localParticipant: {
                ...prev.localParticipant,
                microphone: newMuted ? 'muted' : 'enabled',
              },
            }
          : null
      );
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      const newCameraOff = !isCameraOff;
      client.toggleCamera(!newCameraOff);
      setIsCameraOff(newCameraOff);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              localParticipant: {
                ...prev.localParticipant,
                camera: newCameraOff ? 'off' : 'enabled',
              },
            }
          : null
      );
    }
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenShareStreamRef.current) {
          screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
          screenShareStreamRef.current = null;
        }

        // Restore camera
        const localStream = client.getLocalStream();
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            await client.replaceVideoTrack(videoTrack);
          }
        }

        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await client.requestScreenShare();
        screenShareStreamRef.current = screenStream;

        const [screenTrack] = screenStream.getVideoTracks();
        if (screenTrack) {
          await client.replaceVideoTrack(screenTrack);

          screenTrack.onended = async () => {
            setIsScreenSharing(false);
            screenShareStreamRef.current = null;

            const localStream = client.getLocalStream();
            if (localStream) {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) {
                await client.replaceVideoTrack(videoTrack);
              }
            }
          };
        }

        setIsScreenSharing(true);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle screen share', err);
      onError?.(err);
    }
  }, [isScreenSharing, onError]);

  const setVideoQuality = useCallback(
    async (quality: VideoQuality) => {
      const client = clientRef.current;
      if (!client || !localStream) {
        setVideoQualityState(quality);
        return;
      }

      try {
        // Stop current stream
        localStream.getTracks().forEach((track) => track.stop());

        // Request new stream with new quality
        const newStream = await client.requestMediaStream(quality);
        setLocalStream(newStream);

        // Replace tracks in peer connection
        const pc = client.getPeerConnection();
        if (pc) {
          const senders = pc.getSenders();
          for (const sender of senders) {
            if (sender.track?.kind === 'video') {
              const [newVideoTrack] = newStream.getVideoTracks();
              if (newVideoTrack) {
                await sender.replaceTrack(newVideoTrack);
              }
            }
            if (sender.track?.kind === 'audio') {
              const [newAudioTrack] = newStream.getAudioTracks();
              if (newAudioTrack) {
                await sender.replaceTrack(newAudioTrack);
              }
            }
          }
        }

        setVideoQualityState(quality);
        logger.debug('Video quality changed', { quality });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to change video quality', err);
        onError?.(err);
      }
    },
    [localStream, onError]
  );

  return {
    session,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    videoQuality,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setVideoQuality,
  };
}

